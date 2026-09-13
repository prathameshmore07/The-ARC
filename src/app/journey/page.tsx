'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import AppShell from '@/components/shell/AppShell';
import { computeArcLevel } from '@/lib/game-engine';
import {
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Lock,
  MapPin,
  Sparkles,
  ArrowRight,
  X,
  Coins,
  Flame,
  Shield,
} from 'lucide-react';

interface TrajectoryNode {
  id: string;
  day: string;
  locationName: string;
  title: string;
  subtitle: string;
  state: 'completed' | 'current' | 'future';
  date?: string;
  attribute?: string;
  xPercent: number;
  yPercent: number;
  image: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: string;
  unlocked: boolean;
  progressText: string;
  image: string;
}

export default function JourneyPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Live synchronizable HUD metrics
  const [liveMarks, setLiveMarks] = useState(184);
  const [liveStreak, setLiveStreak] = useState(7);
  const [liveTitle, setLiveTitle] = useState('THE BUILDER');
  const [liveInsignia, setLiveInsignia] = useState('CELESTIAL COMPASS');

  const [selectedNode, setSelectedNode] = useState<TrajectoryNode | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

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
        console.error('Failed to load journey data', err);
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

  const totalXp = useMemo(() => {
    return 1180 + totalMomentum;
  }, [totalMomentum]);

  const arcProgression = useMemo(() => {
    return computeArcLevel(totalXp);
  }, [totalXp]);

  const userName = data?.user?.name || data?.user?.email?.split('@')[0] || 'SOVEREIGN PILGRIM';

  const completedCount = useMemo(() => {
    return (data?.completions?.length || 14);
  }, [data]);

  // Dynamic trajectory nodes based on user's progress
  const trajectoryNodes: TrajectoryNode[] = useMemo(() => {
    return [
      {
        id: 'node-start',
        day: 'DAY 01',
        locationName: 'THE THRESHOLD',
        title: 'THE ARC BEGINS',
        subtitle: 'Inertia broken. First intentional move recorded into the sovereign ledger.',
        state: 'completed',
        date: 'Aug 01',
        attribute: 'START',
        xPercent: 18,
        yPercent: 82,
        image: '/images/arc/arc-milestone-01.jpg',
      },
      {
        id: 'node-first-move',
        day: 'DAY 03',
        locationName: 'VALLEY OF INERTIA',
        title: 'FIRST 3 CONSECUTIVE MOVES',
        subtitle: 'Resistance confronted directly. Initial kinetic habit formed.',
        state: 'completed',
        date: 'Aug 03',
        attribute: 'CADENCE',
        xPercent: 28,
        yPercent: 72,
        image: '/images/arc/arc-body.jpg',
      },
      {
        id: 'node-d7',
        day: 'DAY 07',
        locationName: 'FIRST CAIRN',
        title: '7 DAYS COMPLETED',
        subtitle: '7 days of verified intentional action. Sovereign rhythm established.',
        state: 'completed',
        date: 'Aug 08',
        attribute: 'MOMENTUM',
        xPercent: 40,
        yPercent: 62,
        image: '/images/arc/arc-mind.jpg',
      },
      {
        id: 'node-d21',
        day: 'DAY 21',
        locationName: 'RIDGE OF DISCIPLINE',
        title: '21 QUESTS LOGGED',
        subtitle: 'Action occurs without emotional negotiation. Neural baseline locked.',
        state: completedCount >= 10 ? 'completed' : 'current',
        date: 'Aug 22',
        attribute: 'DISCIPLINE',
        xPercent: 54,
        yPercent: 50,
        image: '/images/arc/arc-craft.jpg',
      },
      {
        id: 'node-d42',
        day: 'DAY 42',
        locationName: 'THE ASCENT PASS',
        title: 'FIRST 5K CONTINUOUS RUN',
        subtitle: 'Bodily capacity proven. An unbroken aerobic threshold surpassed.',
        state: completedCount >= 14 ? 'completed' : 'current',
        date: 'Sep 11',
        attribute: 'BODY',
        xPercent: 66,
        yPercent: 40,
        image: '/images/arc/arc-milestone-02.jpg',
      },
      {
        id: 'node-curr',
        day: `DAY ${String(liveStreak).padStart(2, '0')}`,
        locationName: 'SANCTUARY WAYPOINT',
        title: 'CURRENT POSITION',
        subtitle: 'You are here. One move today advances the trajectory toward the summit.',
        state: 'current',
        date: 'TODAY',
        attribute: 'ACTIVE',
        xPercent: 78,
        yPercent: 28,
        image: '/images/arc/arc-dashboard-world.jpg',
      },
      {
        id: 'node-d30',
        day: 'MILESTONE',
        locationName: 'THE CITADEL SUMMIT',
        title: '30 DAYS OF MOMENTUM',
        subtitle: 'A permanent baseline shift across the four sovereign capabilities.',
        state: 'future',
        attribute: 'MOMENTUM',
        xPercent: 88,
        yPercent: 16,
        image: '/images/arc/arc-milestone-03.jpg',
      },
    ];
  }, [completedCount, liveStreak]);

  const unlockedWaypointsCount = useMemo(() => {
    return trajectoryNodes.filter((n) => n.state === 'completed' || n.state === 'current').length;
  }, [trajectoryNodes]);

  // Dynamic Milestones
  const milestones: Milestone[] = useMemo(() => {
    return [
      {
        id: 'm1',
        title: 'FIRST WEEK',
        description: 'Complete 7 days of intentional action. The first proof of self-directed rhythm.',
        category: 'MOMENTUM',
        unlocked: liveStreak >= 7,
        progressText: liveStreak >= 7 ? 'COMPLETED' : `${liveStreak} / 7 DAYS`,
        image: '/images/arc/arc-milestone-01.jpg',
      },
      {
        id: 'm2',
        title: '10 QUESTS',
        description: 'Complete your first 10 verified real-world moves without hesitation.',
        category: 'ACTION',
        unlocked: completedCount >= 10,
        progressText: completedCount >= 10 ? 'COMPLETED' : `${completedCount} / 10 QUESTS`,
        image: '/images/arc/arc-mind.jpg',
      },
      {
        id: 'm3',
        title: 'FIRST 5K CONTINUOUS',
        description: 'Overcome physical friction through steady pacing and unbroken fortitude.',
        category: 'BODY',
        unlocked: true,
        progressText: 'COMPLETED',
        image: '/images/arc/arc-milestone-02.jpg',
      },
      {
        id: 'm4',
        title: '30 DAYS OF MOMENTUM',
        description: '30 consecutive days of intentional action. A new baseline has been established.',
        category: 'DISCIPLINE',
        unlocked: liveStreak >= 30,
        progressText: `${liveStreak} / 30 DAYS`,
        image: '/images/arc/arc-milestone-03.jpg',
      },
      {
        id: 'm5',
        title: 'FIRST PROJECT SHIPPED',
        description: 'Deploy a public-facing tool, software component, or creative artifact.',
        category: 'CRAFT',
        unlocked: completedCount >= 5,
        progressText: completedCount >= 5 ? 'COMPLETED' : 'IN PROGRESS',
        image: '/images/arc/arc-craft.jpg',
      },
      {
        id: 'm6',
        title: '100 HOURS OF DEEP WORK',
        description: 'Accumulate 100 verified server-timed deep focus sessions.',
        category: 'MIND',
        unlocked: false,
        progressText: '42 / 100 HOURS',
        image: '/images/arc/arc-armory.jpg',
      },
    ];
  }, [liveStreak, completedCount]);

  const unlockedMilestonesCount = useMemo(() => {
    return milestones.filter((m) => m.unlocked).length;
  }, [milestones]);

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
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold block mb-2">
              THE TRAJECTORY · CONTINUOUS MAP
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl text-[#F2EEE6] tracking-tight uppercase mb-3">
              Your Journey
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#A6B2C0] font-light max-w-xl leading-relaxed">
              &ldquo;You are not a level. You are a direction.&rdquo; This is not an analytics chart — it is an illustrated world recording the path you have carved through discipline.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded bg-[#080C12]/90 border border-[#1E2938] flex items-center gap-2 text-xs font-mono text-[#EDE8DF]">
              <Flame className="w-3.5 h-3.5 text-[#E07A5F]" />
              <span>{liveStreak}D STREAK</span>
            </div>
            <div className="px-3.5 py-2 rounded bg-[#080C12]/90 border border-[#C5A059]/40 flex items-center gap-2 text-xs font-mono text-[#C5A059]">
              <Coins className="w-3.5 h-3.5" />
              <span>{liveMarks} MARKS</span>
            </div>
          </div>
        </header>

        {/* ─────────────────────────────────────────────────────────────
            01. VISUAL JOURNEY MAP (ENVIRONMENTAL WORLD VIEW)
        ───────────────────────────────────────────────────────────── */}
        <section className="mb-16" aria-label="Visual Journey Map">
          <div className="relative w-full h-[460px] sm:h-[540px] lg:h-[620px] rounded-lg overflow-hidden border border-[#C5A059]/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] group">
            {/* Map Artwork Background */}
            <Image
              src="/images/arc/arc-journey.jpg"
              alt="The ARC Pilgrim Trajectory Map"
              fill
              priority
              className="object-cover object-center transition-transform duration-1000 group-hover:scale-[1.02]"
            />
            {/* Dark vignettes */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080C12] via-transparent to-[#080C12]/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080C12]/50 via-transparent to-[#080C12]/50" />

            {/* Top Map HUD Status */}
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none">
              <div className="px-3 py-1.5 rounded bg-[#080C12]/85 backdrop-blur-md border border-[#1A2534] flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[#C5A059]" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-[#EDE8DF] uppercase font-semibold">
                  TRAJECTORY · DAY {String(liveStreak).padStart(2, '0')} ACTIVE
                </span>
              </div>

              <div className="px-3 py-1.5 rounded bg-[#080C12]/85 backdrop-blur-md border border-[#1A2534] font-mono text-[10px] text-[#C5A059] uppercase tracking-wider">
                {unlockedWaypointsCount} / {trajectoryNodes.length} WAYPOINTS REACHED
              </div>
            </div>

            {/* Interactive Waypoints Pinboard */}
            {trajectoryNodes.map((node) => {
              const isCompleted = node.state === 'completed';
              const isCurrent = node.state === 'current';
              const isFuture = node.state === 'future';

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  style={{
                    left: `${node.xPercent}%`,
                    top: `${node.yPercent}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group/node cursor-pointer focus:outline-none"
                  aria-label={`${node.title} - ${node.day}`}
                >
                  {isCurrent ? (
                    /* Current pulsing beacon */
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-[#C5A059] opacity-75" />
                      <div className="relative w-8 h-8 rounded-full border-2 border-[#C5A059] bg-[#080C12] flex items-center justify-center shadow-[0_0_20px_rgba(197,160,89,0.8)]">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                      </div>

                      {/* Tooltip on hover/active */}
                      <div className="absolute bottom-10 whitespace-nowrap px-3 py-1.5 rounded bg-[#080C12]/95 border border-[#C5A059] shadow-xl text-center pointer-events-none">
                        <span className="block font-mono text-[9px] text-[#C5A059] tracking-widest uppercase font-semibold">
                          YOU ARE HERE · {node.day}
                        </span>
                        <span className="font-display text-xs text-[#F2EEE6] uppercase tracking-wide">
                          {node.locationName}
                        </span>
                      </div>
                    </div>
                  ) : isCompleted ? (
                    /* Completed golden waypoint */
                    <div className="relative flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[#C5A059] text-[#080C12] flex items-center justify-center shadow-[0_0_14px_rgba(197,160,89,0.5)] transition-transform group-hover/node:scale-125">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div className="opacity-0 group-hover/node:opacity-100 transition-opacity absolute bottom-9 whitespace-nowrap px-2.5 py-1 rounded bg-[#080C12]/90 border border-[#1E2938] text-center pointer-events-none">
                        <span className="font-mono text-[9px] text-[#C5A059] uppercase block">{node.day}</span>
                        <span className="font-display text-xs text-[#EDE8DF] uppercase">{node.title}</span>
                      </div>
                    </div>
                  ) : (
                    /* Future quiet beacon */
                    <div className="relative flex items-center justify-center opacity-65 group-hover/node:opacity-100">
                      <div className="w-6 h-6 rounded-full border border-[#3A4A5E] bg-[#080C12]/80 flex items-center justify-center text-[#6B7784] transition-transform group-hover/node:scale-110">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3A4A5E]" />
                      </div>
                      <div className="opacity-0 group-hover/node:opacity-100 transition-opacity absolute bottom-8 whitespace-nowrap px-2.5 py-1 rounded bg-[#080C12]/90 border border-[#1E2938] text-center pointer-events-none">
                        <span className="font-mono text-[9px] text-[#8B97A6] uppercase block">{node.day}</span>
                        <span className="font-display text-xs text-[#EDE8DF] uppercase">{node.title}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {/* Bottom Map Note */}
            <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-[10px] font-mono text-[#8B97A6] pointer-events-none">
              <span>CLICK ANY WAYPOINT TO INSPECT LOG</span>
              <span className="hidden sm:inline text-[#C5A059]">TRAJECTORY VELOCITY: +84 / WEEK</span>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            02. THE CONTINUOUS VERTICAL TIMELINE LEDGER
        ───────────────────────────────────────────────────────────── */}
        <section className="mb-20" aria-label="Timeline Nodes">
          <div className="flex items-center justify-between pb-3 mb-8 border-b border-[#1A222C]">
            <h2 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
              Waypoints &amp; Locations
            </h2>
            <span className="font-mono text-[10px] text-[#C5A059] tracking-widest uppercase">
              CHRONICLE
            </span>
          </div>

          <div className="relative pl-6 sm:pl-10 space-y-6">
            <div className="absolute top-3 bottom-3 left-[17px] sm:left-[21px] w-[2px] bg-[#1E2A3A]" />

            {trajectoryNodes.map((node) => {
              const isCompleted = node.state === 'completed';
              const isCurrent = node.state === 'current';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="relative flex items-start gap-5 group cursor-pointer"
                >
                  <div className="relative z-10 shrink-0 mt-1">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-[#C5A059] text-[#080C12] flex items-center justify-center shadow-[0_0_10px_rgba(197,160,89,0.4)]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#C5A059] bg-[#080C12] flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-[#232F40] bg-[#0A0E14] flex items-center justify-center text-[#4A5565]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#232F40]" />
                      </div>
                    )}
                  </div>

                  <div
                    className={`flex-1 p-5 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-[#C5A059] bg-[#0C121B] shadow-[0_4px_24px_rgba(197,160,89,0.15)]'
                        : isCompleted
                        ? 'border-[#1A222C] bg-[#0A0E14] hover:border-[#2C3B4E]'
                        : 'border-[#141B24] bg-[#070A0F]/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className={isCurrent ? 'text-[#C5A059] font-semibold' : 'text-[#6B7784]'}>
                          {node.day}
                        </span>
                        <span className="text-[#38485C]">·</span>
                        <span className="text-[#8B97A6] uppercase">{node.locationName}</span>
                      </div>
                      {node.date && <span className="text-[#4A5565]">{node.date}</span>}
                    </div>

                    <h3
                      className={`font-display text-xl uppercase tracking-wide mb-1 ${
                        isCurrent ? 'text-[#F2EEE6] font-semibold' : isCompleted ? 'text-[#EDE8DF]' : 'text-[#7E8B99]'
                      }`}
                    >
                      {node.title}
                    </h3>
                    <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed">
                      {node.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            03. MILESTONE LEDGER WITH ARTWORK CARDS
        ───────────────────────────────────────────────────────────── */}
        <section aria-label="Milestones">
          <div className="flex items-center justify-between pb-3 mb-8 border-b border-[#1A222C]">
            <div>
              <h2 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                Milestone Ledger
              </h2>
              <p className="font-sans text-xs text-[#7E8B99] font-light">
                Milestones establish permanent baselines. They cannot be lost.
              </p>
            </div>
            <span className="font-mono text-xs text-[#C5A059] tracking-wider uppercase">
              {unlockedMilestonesCount} / {milestones.length} UNLOCKED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((m) => {
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMilestone(m)}
                  className={`group rounded-lg overflow-hidden border transition-all cursor-pointer ${
                    m.unlocked
                      ? 'border-[#C5A059]/60 bg-[#0C121B] hover:border-[#C5A059] shadow-[0_8px_30px_rgba(197,160,89,0.1)]'
                      : 'border-[#1A222C] bg-[#0A0E14] hover:border-[#2C3B4E]'
                  }`}
                >
                  <div className="relative h-36 w-full overflow-hidden">
                    <Image
                      src={m.image}
                      alt={m.title}
                      fill
                      className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
                        m.unlocked ? 'opacity-80' : 'opacity-35 grayscale'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-[#0A0E14]/60 to-transparent" />

                    <div className="absolute top-3 right-3">
                      {m.unlocked ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2.5 py-0.5 rounded bg-[#C5A059] text-[#080C12] uppercase font-semibold">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>UNLOCKED</span>
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] px-2.5 py-0.5 rounded bg-[#080C12]/80 border border-[#1E2938] text-[#8B97A6]">
                          {m.progressText}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-4">
                      <span className="font-mono text-[9px] tracking-widest text-[#C5A059] uppercase block">
                        {m.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-display font-semibold text-xl text-[#F2EEE6] uppercase tracking-wide mb-2 group-hover:text-[#C5A059] transition-colors">
                      {m.title}
                    </h3>
                    <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          WAYPOINT INSPECTION MODAL
      ───────────────────────────────────────────────────────────── */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-lg w-full bg-[#0C1016] border border-[#243040] shadow-[0_30px_90px_rgba(0,0,0,0.95)] rounded-lg overflow-hidden">
            <div className="relative h-44 w-full">
              <Image src={selectedNode.image} alt={selectedNode.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C1016] via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="absolute top-4 right-4 text-[#EDE8DF] bg-black/60 p-1.5 rounded-full hover:bg-black transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 text-left">
              <div className="flex items-center justify-between text-xs font-mono text-[#C5A059] uppercase tracking-wider mb-2">
                <span>{selectedNode.day} · {selectedNode.locationName}</span>
                <span>{selectedNode.state.toUpperCase()}</span>
              </div>

              <h3 className="font-display font-semibold text-3xl text-[#F2EEE6] uppercase tracking-wide mb-3">
                {selectedNode.title}
              </h3>

              <p className="font-sans text-sm text-[#A6B2C0] font-light leading-relaxed mb-6">
                {selectedNode.subtitle}
              </p>

              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="w-full py-3 bg-[#C5A059] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold hover:bg-[#D4B57A] transition-colors rounded shadow-lg cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MILESTONE MODAL WITH VISUAL PANEL
      ───────────────────────────────────────────────────────────── */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-lg w-full bg-[#0C1016] border border-[#243040] shadow-[0_30px_90px_rgba(0,0,0,0.95)] rounded-lg overflow-hidden">
            <div className="relative h-48 w-full">
              <Image src={selectedMilestone.image} alt={selectedMilestone.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C1016] via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-4 right-4 text-[#EDE8DF] bg-black/60 p-1.5 rounded-full hover:bg-black transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8 text-center">
              <span className="font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-1">
                {selectedMilestone.unlocked ? 'MILESTONE ESTABLISHED' : 'UPCOMING MILESTONE'}
              </span>
              <h3 className="font-display font-semibold text-3xl text-[#F2EEE6] uppercase tracking-wide mb-2">
                {selectedMilestone.title}
              </h3>
              <p className="font-sans text-xs sm:text-sm text-[#8B97A6] font-light leading-relaxed mb-6">
                {selectedMilestone.description}
              </p>

              <div className="p-3 bg-[#080C12] border border-[#161F2A] rounded font-mono text-xs text-[#C5A059] mb-6">
                {selectedMilestone.unlocked ? 'A new baseline has been established. This capability is permanently locked.' : `Progress: ${selectedMilestone.progressText}`}
              </div>

              <button
                type="button"
                onClick={() => setSelectedMilestone(null)}
                className="w-full py-3 bg-[#C5A059] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold hover:bg-[#D4B57A] transition-colors rounded shadow-lg cursor-pointer"
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
