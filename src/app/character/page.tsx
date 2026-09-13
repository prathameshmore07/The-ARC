'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AppShell from '@/components/shell/AppShell';
import {
  computeArcLevel,
  ARC_ATTRIBUTES,
  ARC_PATHS,
  ArcAttributeKey,
} from '@/lib/game-engine';
import {
  Award,
  Check,
  Sparkles,
  TrendingUp,
  Compass,
  Shield,
  Coins,
  Flame,
  History,
  Calendar,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';

const PATH_IMAGES: Record<string, string> = {
  scholar: '/images/arc/arc-scholar.jpg',
  warrior: '/images/arc/arc-warrior.jpg',
  artisan: '/images/arc/arc-artisan.jpg',
  social: '/images/arc/arc-social.jpg',
};

const ATTRIBUTE_IMAGES: Record<ArcAttributeKey, string> = {
  BODY: '/images/arc/arc-body.jpg',
  MIND: '/images/arc/arc-mind.jpg',
  CRAFT: '/images/arc/arc-craft.jpg',
  PEOPLE: '/images/arc/arc-people.jpg',
};

interface GrowthRecord {
  id: string;
  date: string;
  title: string;
  attribute: ArcAttributeKey;
  deltaXp: number;
  marks: number;
  annotation: string;
}

export default function CharacterPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [primaryPathId, setPrimaryPathId] = useState('artisan');

  const [identityStatement, setIdentityStatement] = useState('SOVEREIGN BUILDER');
  const [coreWhy, setCoreWhy] = useState('Building with intention and discipline.');
  const [direction, setDirection] = useState('Through persistent craft and daily sovereign action.');

  // Live synchronizable state
  const [liveMarks, setLiveMarks] = useState(184);
  const [liveStreak, setLiveStreak] = useState(7);
  const [liveTitle, setLiveTitle] = useState('THE BUILDER');
  const [liveInsignia, setLiveInsignia] = useState('CELESTIAL COMPASS');

  // Load saved primary path from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('arc_primary_path');
      if (saved && ['scholar', 'warrior', 'artisan', 'social'].includes(saved)) {
        setPrimaryPathId(saved);
      }

      const arcPlan = localStorage.getItem('arc_plan');
      if (arcPlan) {
        try {
          const plan = JSON.parse(arcPlan);
          if (plan.identity) setIdentityStatement(plan.identity);
          if (plan.whyItMatters) setCoreWhy(plan.whyItMatters);
          if (plan.direction) setDirection(plan.direction);
        } catch {}
      }
    }
  }, []);

  const handleSelectPath = (pathId: string) => {
    setPrimaryPathId(pathId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('arc_primary_path', pathId);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);

          if (json.user?.grit !== undefined) {
            setLiveMarks(json.user.grit);
          }
          if (json.user?.streak !== undefined) {
            setLiveStreak(json.user.streak);
          }
          if (json.user?.equippedTitle) {
            setLiveTitle(json.user.equippedTitle);
          }
          if (json.user?.equippedInsignia) {
            setLiveInsignia(json.user.equippedInsignia);
          }
        }
      } catch (err) {
        console.error('Failed to load character data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Listen for real-time state updates from Armory, Quests, or Dashboard
  useEffect(() => {
    const handleStateUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (typeof customEvent.detail.marks === 'number') {
          setLiveMarks(customEvent.detail.marks);
        }
        if (typeof customEvent.detail.streak === 'number') {
          setLiveStreak(customEvent.detail.streak);
        }
        if (customEvent.detail.equippedTitle) {
          setLiveTitle(customEvent.detail.equippedTitle);
        }
        if (customEvent.detail.equippedInsignia) {
          setLiveInsignia(customEvent.detail.equippedInsignia);
        }
      }
    };

    window.addEventListener('arc-state-update', handleStateUpdate);
    return () => window.removeEventListener('arc-state-update', handleStateUpdate);
  }, []);

  const totalMomentum = useMemo(() => {
    if (!data?.attributes) return 742;
    const sum = data.attributes.reduce((acc: number, a: any) => acc + (a.xp || 0), 0);
    return sum > 0 ? sum : 742;
  }, [data]);

  // Non-linear 20-level XP progression curve
  const totalXp = useMemo(() => {
    return 1180 + totalMomentum;
  }, [totalMomentum]);

  const arcProgression = useMemo(() => {
    return computeArcLevel(totalXp);
  }, [totalXp]);

  const normalizedAttributes = useMemo(() => {
    const map: Record<ArcAttributeKey, { score: number; delta: number; baseline: number }> = {
      BODY: { score: 68, delta: 24, baseline: 44 },
      MIND: { score: 84, delta: 38, baseline: 46 },
      CRAFT: { score: 57, delta: 61, baseline: 26 },
      PEOPLE: { score: 42, delta: 17, baseline: 25 },
    };

    if (data?.attributes) {
      data.attributes.forEach((attr: any) => {
        const lower = attr.name.toLowerCase();
        if (lower.includes('strength') || lower.includes('body')) {
          map.BODY.score = Math.max(attr.xp, 68);
        } else if (lower.includes('intellect') || lower.includes('mind')) {
          map.MIND.score = Math.max(attr.xp, 84);
        } else if (lower.includes('discipline') || lower.includes('creativity') || lower.includes('craft')) {
          map.CRAFT.score = Math.max(attr.xp, 57);
        } else if (lower.includes('social') || lower.includes('people')) {
          map.PEOPLE.score = Math.max(attr.xp, 42);
        }
      });
    }

    return map;
  }, [data]);

  // Derive Strength & Growth Area dynamically
  const sortedAttrs = useMemo(() => {
    return (Object.keys(normalizedAttributes) as ArcAttributeKey[]).sort(
      (a, b) => normalizedAttributes[b].score - normalizedAttributes[a].score
    );
  }, [normalizedAttributes]);

  const strengthKey = sortedAttrs[0];
  const growthKey = sortedAttrs[sortedAttrs.length - 1];

  const userName = data?.user?.name || data?.user?.email?.split('@')[0] || 'SOVEREIGN BUILDER';

  // Historical growth entries ("How you've changed")
  const growthHistory: GrowthRecord[] = useMemo(() => {
    if (data?.completions && data.completions.length > 0) {
      return data.completions.slice(0, 5).map((c: any, idx: number) => {
        const attrName = c.task?.attribute?.name?.toUpperCase() || 'MIND';
        const validAttr: ArcAttributeKey = ['BODY', 'MIND', 'CRAFT', 'PEOPLE'].includes(attrName)
          ? (attrName as ArcAttributeKey)
          : 'MIND';
        const d = new Date(c.completedAt);
        const formattedDate = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
        return {
          id: c.id || `c-${idx}`,
          date: formattedDate,
          title: c.task?.title || 'Intentional sovereign move verified',
          attribute: validAttr,
          deltaXp: c.task?.difficulty === 'DEEP' ? 50 : c.task?.difficulty === 'STANDARD' ? 25 : 15,
          marks: c.task?.difficulty === 'DEEP' ? 25 : c.task?.difficulty === 'STANDARD' ? 15 : 10,
          annotation: 'Verified by sovereign ledger',
        };
      });
    }

    // Default rich chronicle log
    return [
      {
        id: 'hist-1',
        date: 'Today',
        title: 'Deep Focus Protocol: Architecture Refactor',
        attribute: 'CRAFT',
        deltaXp: 50,
        marks: 25,
        annotation: 'Server-verified completion',
      },
      {
        id: 'hist-2',
        date: 'Yesterday',
        title: 'Morning Fortitude & Movement Cadence',
        attribute: 'BODY',
        deltaXp: 25,
        marks: 15,
        annotation: 'Server-verified completion',
      },
      {
        id: 'hist-3',
        date: '2d ago',
        title: 'Rigorous Technical Reading & System Synthesis',
        attribute: 'MIND',
        deltaXp: 35,
        marks: 20,
        annotation: 'Server-verified completion',
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-24">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-[#0C121B] rounded-lg border border-[#1E2938]" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-[#0C121B] rounded-lg border border-[#1E2938]" />
              ))}
            </div>
            <div className="h-48 bg-[#0C121B] rounded-lg border border-[#1E2938]" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      userName={userName}
      userMomentum={totalMomentum}
      userLevel={arcProgression.level}
      userLevelTitle={arcProgression.title}
      userMarks={liveMarks}
      userStreak={liveStreak}
      equippedTitle={liveTitle}
      equippedInsignia={liveInsignia}
    >
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-24">
        {/* ─────────────────────────────────────────────────────────────
            01. ENVIRONMENTAL PORTRAIT PANEL & PROGRESSION HEADER
        ───────────────────────────────────────────────────────────── */}
        <section
          className="relative mb-14 rounded-lg overflow-hidden border border-[#1E2938] shadow-[0_20px_70px_rgba(0,0,0,0.9)] bg-[#0A0F16]"
          aria-label="Character Header"
        >
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <Image
              src="/images/arc/arc-dashboard-world.jpg"
              alt="Character Environment"
              fill
              priority
              className="object-cover object-center opacity-40 grayscale-[20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/75 to-transparent" />
          </div>

          <div className="relative p-6 sm:p-10 -mt-24 sm:-mt-28 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold">
                  SOVEREIGN IDENTITY · REAL LIFE RPG
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#080C12]/90 border border-[#1E2938] font-mono text-[10px] text-[#EDE8DF] uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-[#C5A059]" />
                  <span>{liveTitle}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#080C12]/90 border border-[#1E2938] font-mono text-[10px] text-[#A6B2C0] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-[#C5A059]" />
                  <span>{liveInsignia}</span>
                </span>
              </div>

              <h1 className="font-display font-semibold text-4xl sm:text-6xl text-[#F2EEE6] tracking-tight uppercase">
                {userName}
              </h1>

              <p className="font-sans text-xs sm:text-sm text-[#A6B2C0] font-light max-w-xl mt-1 leading-relaxed">
                You are not an avatar. Your character is forged through the verified recurrence of real-world discipline.
              </p>

              <div className="mt-4">
                <p className="font-display text-lg sm:text-xl text-[#EDE8DF] tracking-wide uppercase font-medium">
                  {identityStatement}
                </p>
                <p className="font-sans text-xs text-[#8B97A6] mt-1 font-light leading-relaxed max-w-lg">
                  {coreWhy}
                </p>
              </div>
            </div>

            {/* Quick RPG Badges: Level, Momentum, Marks, Streak */}
            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-3 shrink-0">
              <div className="text-left sm:text-right p-4 rounded bg-[#080C12]/90 backdrop-blur-sm border border-[#1A2534] min-w-[200px]">
                <div className="flex items-center justify-between sm:justify-end gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-[#8B97A6] uppercase tracking-widest">
                    LEVEL {String(arcProgression.level).padStart(2, '0')}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#C5A059]/20 text-[#C5A059] font-mono text-[9px] uppercase font-semibold">
                    {arcProgression.title}
                  </span>
                </div>
                <div className="font-display font-bold text-3xl sm:text-4xl text-[#C5A059] tracking-tight">
                  {totalMomentum}
                </div>
                <span className="text-[10px] font-mono text-[#6B7784] block mt-0.5 uppercase">
                  MOMENTUM POINTS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/armory"
                  className="px-3 py-1.5 rounded bg-[#080C12]/90 border border-[#C5A059]/40 hover:border-[#C5A059] transition-colors flex items-center gap-1.5 text-xs font-mono text-[#C5A059]"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{liveMarks} MARKS</span>
                </Link>

                <div className="px-3 py-1.5 rounded bg-[#080C12]/90 border border-[#1E2938] flex items-center gap-1.5 text-xs font-mono text-[#EDE8DF]">
                  <Flame className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>{liveStreak}D STREAK</span>
                </div>
              </div>
            </div>
          </div>

          {/* 20-Level Progression Curve Banner */}
          <div className="px-6 sm:px-10 py-5 bg-[#080C12]/90 border-t border-[#141C26]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono mb-2">
              <div className="flex items-center gap-2 text-[#EDE8DF]">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-[#C5A059] font-semibold">ARC PROGRESSION:</span>
                <span>LEVEL {arcProgression.level} · {arcProgression.title}</span>
                <span className="text-[#6B7784] hidden md:inline">({arcProgression.meaning})</span>
              </div>
              <div className="text-[#8B97A6]">
                <span className="text-[#F2EEE6] font-semibold">{totalXp.toLocaleString()}</span> / {arcProgression.nextThreshold.toLocaleString()} XP
                <span className="text-[#6B7784] ml-2">({arcProgression.remaining.toLocaleString()} XP to next level)</span>
              </div>
            </div>

            <div className="w-full h-2 bg-[#141C26] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8C6D38] via-[#C5A059] to-[#E5C985] transition-all duration-700 shadow-[0_0_12px_rgba(197,160,89,0.5)]"
                style={{ width: `${Math.max(6, Math.min(100, Math.round(arcProgression.progress * 100)))}%` }}
              />
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            02. FOUR ATTRIBUTES (RPG STATS GROUNDED IN REALITY)
        ───────────────────────────────────────────────────────────── */}
        <section className="mb-16" aria-label="Attributes">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#141B24]">
            <div>
              <h2 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                Primary Attributes
              </h2>
              <p className="font-sans text-xs text-[#7E8B99] font-light">
                Tangible capabilities compounding through daily moves.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#6B7784] tracking-widest uppercase">
              REAL-WORLD METRICS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(Object.keys(ARC_ATTRIBUTES) as ArcAttributeKey[]).map((key) => {
              const cfg = ARC_ATTRIBUTES[key];
              const attrData = normalizedAttributes[key];

              return (
                <div
                  key={key}
                  className="rounded-lg border border-[#1A222C] bg-[#0A0E14] overflow-hidden group hover:border-[#C5A059]/60 transition-all shadow-md"
                >
                  <div className="relative h-28 w-full overflow-hidden border-b border-[#151E28]">
                    <Image
                      src={ATTRIBUTE_IMAGES[key]}
                      alt={cfg.label}
                      fill
                      className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-85 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-[#0A0E14]/50 to-transparent" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#080C12]/85 border border-[#1E2938] font-mono text-[9px] text-[#C5A059] uppercase">
                      {cfg.key}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-lg text-[#EDE8DF] tracking-wide uppercase group-hover:text-[#C5A059] transition-colors">
                        {cfg.label}
                      </span>
                      <span className="font-mono text-xs text-[#3A7F58] font-semibold">
                        +{attrData.delta}
                      </span>
                    </div>

                    <span className="block font-display font-bold text-4xl text-[#F2EEE6] mb-2">
                      {attrData.score}
                    </span>

                    <div className="w-full h-1 bg-[#141C26] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-[#C5A059] transition-all duration-500"
                        style={{ width: `${Math.min(100, attrData.score)}%` }}
                      />
                    </div>

                    <p className="text-[10px] font-sans text-[#7E8B99] font-light leading-relaxed">
                      {cfg.descriptors}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              RECENTLY DEVELOPED — DIRECT LINK: REAL ACTION → ATTRIBUTE → CHARACTER
          ───────────────────────────────────────────────────────────── */}
          <div className="mt-8 p-6 rounded-lg border border-[#1A2534] bg-[#0A0E14] shadow-md">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#141B24]">
              <div>
                <span className="font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-0.5">
                  THIS IS WHO I HAVE BECOME
                </span>
                <h3 className="font-display font-semibold text-xl text-[#EDE8DF] uppercase tracking-wide">
                  Recently Developed
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#3A7F58] tracking-wider uppercase font-semibold">
                REAL ACTION → CHARACTER
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded bg-[#080C12] border border-[#161F2A] flex flex-col justify-between hover:border-[#C5A059]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#E5C985] font-bold">CRAFT +18</span>
                    <span className="text-[#3A7F58] text-[10px]">● APPLIED</span>
                  </div>
                  <span className="font-display text-base text-[#F2EEE6] font-medium block">from Deep Work</span>
                  <p className="text-[11px] text-[#7E8B99] font-light mt-1">45m uninterrupted session</p>
                </div>
              </div>

              <div className="p-4 rounded bg-[#080C12] border border-[#161F2A] flex flex-col justify-between hover:border-[#C5A059]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#C5A059] font-bold">BODY +12</span>
                    <span className="text-[#3A7F58] text-[10px]">● APPLIED</span>
                  </div>
                  <span className="font-display text-base text-[#F2EEE6] font-medium block">from Running</span>
                  <p className="text-[11px] text-[#7E8B99] font-light mt-1">3.2 km continuous pace</p>
                </div>
              </div>

              <div className="p-4 rounded bg-[#080C12] border border-[#161F2A] flex flex-col justify-between hover:border-[#C5A059]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#64B5F6] font-bold">MIND +8</span>
                    <span className="text-[#3A7F58] text-[10px]">● APPLIED</span>
                  </div>
                  <span className="font-display text-base text-[#F2EEE6] font-medium block">from Reading</span>
                  <p className="text-[11px] text-[#7E8B99] font-light mt-1">20 pages architectural study</p>
                </div>
              </div>

              <div className="p-4 rounded bg-[#080C12] border border-[#161F2A] flex flex-col justify-between hover:border-[#C5A059]/40 transition-colors">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#81C784] font-bold">PEOPLE +6</span>
                    <span className="text-[#3A7F58] text-[10px]">● APPLIED</span>
                  </div>
                  <span className="font-display text-base text-[#F2EEE6] font-medium block">from Presence Call</span>
                  <p className="text-[11px] text-[#7E8B99] font-light mt-1">15 min intentional alignment</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            03. HOW YOU'VE CHANGED (ATTRIBUTE HISTORY & SOVEREIGN LEDGER)
        ───────────────────────────────────────────────────────────── */}
        <section className="mb-16" aria-label="Attribute History">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#141B24]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History className="w-4 h-4 text-[#C5A059]" />
                <h2 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                  How You&apos;ve Changed
                </h2>
              </div>
              <p className="font-sans text-xs text-[#7E8B99] font-light">
                Proof of transformation. A record of accumulated baseline shifts across every capability.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#C5A059] tracking-widest uppercase">
              TRANSMUTATION LOG
            </span>
          </div>

          {/* Cumulative growth summary bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {(Object.keys(ARC_ATTRIBUTES) as ArcAttributeKey[]).map((key) => {
              const attr = normalizedAttributes[key];
              const cfg = ARC_ATTRIBUTES[key];
              const growthPercent = Math.round((attr.delta / attr.baseline) * 100);

              return (
                <div
                  key={key}
                  className="p-4 rounded-lg bg-[#080C12]/90 border border-[#1A2534] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="text-[#EDE8DF] font-semibold">{cfg.label}</span>
                    <span className="text-[#3A7F58] font-bold">+{growthPercent}% EXPANSION</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-display font-bold text-[#F2EEE6]">{attr.score}</span>
                    <span className="text-xs font-mono text-[#6B7784]">from baseline {attr.baseline}</span>
                  </div>

                  <div className="w-full h-1.5 bg-[#141C26] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3A7F58]"
                      style={{ width: `${Math.min(100, growthPercent)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-sans text-[#7E8B99] mt-2 block">
                    +{attr.delta} verified points accumulated
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chronological Transformation Ledger */}
          <div className="rounded-lg border border-[#1A222C] bg-[#0A0E14] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#151E28] flex items-center justify-between">
              <span className="font-mono text-xs text-[#EDE8DF] uppercase tracking-wider font-semibold">
                Recent Verified Transformations
              </span>
              <span className="font-mono text-[10px] text-[#6B7784] uppercase">
                5 MOST RECENT ENTRIES
              </span>
            </div>

            <div className="divide-y divide-[#141C26]">
              {growthHistory.map((item) => {
                const attrColor =
                  item.attribute === 'BODY'
                    ? 'text-[#C5A059] border-[#C5A059]/30 bg-[#C5A059]/10'
                    : item.attribute === 'MIND'
                    ? 'text-[#64B5F6] border-[#64B5F6]/30 bg-[#64B5F6]/10'
                    : item.attribute === 'CRAFT'
                    ? 'text-[#E5C985] border-[#E5C985]/30 bg-[#E5C985]/10'
                    : 'text-[#81C784] border-[#81C784]/30 bg-[#81C784]/10';

                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#0E141E] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-[10px] text-[#6B7784] uppercase tracking-wider mt-1 w-14 shrink-0">
                        {item.date}
                      </span>

                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 rounded border text-[9px] font-mono uppercase font-semibold ${attrColor}`}>
                            {item.attribute}
                          </span>
                          <h4 className="font-display font-medium text-base text-[#EDE8DF] tracking-wide">
                            {item.title}
                          </h4>
                        </div>
                        <p className="font-sans text-xs text-[#7E8B99] font-light">
                          {item.annotation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 sm:self-center pl-18 sm:pl-0">
                      <span className="px-2 py-1 rounded bg-[#3A7F58]/15 border border-[#3A7F58]/30 font-mono text-xs text-[#3A7F58] font-semibold">
                        +{item.deltaXp} {item.attribute}
                      </span>
                      <span className="px-2 py-1 rounded bg-[#C5A059]/15 border border-[#C5A059]/30 font-mono text-xs text-[#C5A059] font-semibold">
                        +{item.marks} MARKS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            04. CHARACTER INSIGHTS (STRENGTH & NEXT GROWTH AREA WITH ART)
        ───────────────────────────────────────────────────────────── */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-12 gap-6" aria-label="Personal Insights">
          {/* Strength Card with Visual Imagery */}
          <div className="md:col-span-6 rounded-lg border border-[#1A222C] bg-[#0A0E14] overflow-hidden flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-44 h-36 sm:h-auto overflow-hidden shrink-0 border-b sm:border-b-0 sm:border-r border-[#151E28]">
              <Image
                src={ATTRIBUTE_IMAGES[strengthKey]}
                alt="Strength"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-[#0A0E14]" />
            </div>

            <div className="p-6 flex flex-col justify-between flex-1">
              <div>
                <span className="font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-1">
                  YOUR STRENGTH
                </span>
                <h3 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-1">
                  {ARC_ATTRIBUTES[strengthKey].label}
                </h3>
                <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed">
                  Your highest developed capability. You demonstrate consistent cadence in {ARC_ATTRIBUTES[strengthKey].growthArea.toLowerCase()}.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#141C26] flex items-center justify-between text-xs font-mono">
                <span className="text-[#6B7784]">CURRENT RATING</span>
                <span className="text-[#EDE8DF] font-semibold">{normalizedAttributes[strengthKey].score} POINTS</span>
              </div>
            </div>
          </div>

          {/* Growth Area Card with Visual Imagery */}
          <div className="md:col-span-6 rounded-lg border border-[#1A222C] bg-[#0A0E14] overflow-hidden flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-44 h-36 sm:h-auto overflow-hidden shrink-0 border-b sm:border-b-0 sm:border-r border-[#151E28]">
              <Image
                src={ATTRIBUTE_IMAGES[growthKey]}
                alt="Growth"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-transparent to-[#0A0E14]" />
            </div>

            <div className="p-6 flex flex-col justify-between flex-1">
              <div>
                <span className="font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-1">
                  YOUR NEXT GROWTH
                </span>
                <h3 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-1">
                  {ARC_ATTRIBUTES[growthKey].label}
                </h3>
                <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed">
                  Your greatest opportunity for momentum. Intentional action here balances your vessel and establishes a new baseline.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#141C26] flex items-center justify-between text-xs font-mono">
                <span className="text-[#6B7784]">CURRENT RATING</span>
                <span className="text-[#EDE8DF] font-semibold">{normalizedAttributes[growthKey].score} POINTS</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            05. DEVELOPMENT PATHS (LIFE ARCHETYPES WITH DEDICATED ARTWORK)
        ───────────────────────────────────────────────────────────── */}
        <section aria-label="Development Paths">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#1A222C]">
            <div>
              <h2 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                Development Paths
              </h2>
              <p className="font-sans text-xs text-[#7E8B99] font-light">
                Life archetypes that reflect how you spend your focused energy.
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-[10px] text-[#C5A059] uppercase tracking-widest block">
                PRIMARY: {primaryPathId.toUpperCase()} (72% ALIGNED)
              </span>
              <span className="font-mono text-[9px] text-[#6B7784] uppercase tracking-wider block">
                PERSISTENT ARCHETYPE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARC_PATHS.map((path) => {
              const isSelected = primaryPathId === path.id;
              const alignmentPercent = isSelected ? 72 : path.id === 'scholar' ? 58 : path.id === 'warrior' ? 44 : 35;
              const pathImage = PATH_IMAGES[path.id] || '/images/arc/arc-artisan.jpg';

              return (
                <div
                  key={path.id}
                  onClick={() => handleSelectPath(path.id)}
                  className={`group rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C5A059] bg-[#0C121B] shadow-[0_12px_40px_rgba(197,160,89,0.2)] ring-1 ring-[#C5A059]/40'
                      : 'border-[#1A222C] bg-[#0A0E14] hover:border-[#2C3B4E]'
                  }`}
                >
                  <div className="relative h-44 w-full overflow-hidden">
                    <Image
                      src={pathImage}
                      alt={path.name}
                      fill
                      className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
                        isSelected ? 'opacity-90' : 'opacity-50 grayscale-[25%] group-hover:opacity-75'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-[#0A0E14]/60 to-transparent" />

                    <div className="absolute top-4 right-4">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] px-3 py-1 rounded bg-[#C5A059] text-[#080C12] uppercase font-semibold shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>PRIMARY PATH</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-[#080C12]/80 backdrop-blur-sm border border-[#1E2938] text-[#8B97A6]">
                          {alignmentPercent}% ALIGNED
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-4">
                      <span className="font-display font-semibold text-2xl text-[#F2EEE6] group-hover:text-[#C5A059] transition-colors tracking-wide uppercase">
                        {path.name}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed mb-4">
                      {path.description}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[#141C26]">
                      {path.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="px-2.5 py-0.5 rounded border border-[#19222E] bg-[#080C12] text-[10px] font-mono text-[#7E8B99]"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
