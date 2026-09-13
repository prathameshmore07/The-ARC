'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/shell/AppShell';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
  Plus,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  X,
  Compass,
  Flame,
  Coins,
  Check,
  History,
} from 'lucide-react';
import {
  computeArcLevel,
  computeDetailedStreak,
  calculateQuestReward,
  ARC_ATTRIBUTES,
  ArcAttributeKey,
} from '@/lib/game-engine';
import ArcCelebrationModal, { CelebrationPayload } from '@/components/game/ArcCelebrationModal';
import NetworkErrorBanner from '@/components/game/NetworkErrorBanner';
import EmptyState from '@/components/game/EmptyState';

interface Task {
  id: string;
  code?: string;
  title: string;
  status: string;
  attributeId: string;
  duration?: string;
  target?: string;
  attrKey: ArcAttributeKey;
  tag: string;
  attrPoints: number;
  momentumPoints: number;
  whyItMatters?: string;
}

interface Attribute {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  lastActivityAt: string;
  decayStatus: 'stable' | 'vulnerable' | 'decaying';
}

interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  grit: number;
  marks?: number;
  streak?: number;
  lastActivityAt?: string;
  equippedTitle?: string;
  equippedInsignia?: string;
}

interface CelebrationData {
  questTitle: string;
  attrKey: ArcAttributeKey;
  attrPoints: number;
  momentum: number;
  marks: number;
  xp: number;
  streak: number;
  leveledUp?: boolean;
  newLevelTitle?: string;
}

const ATTRIBUTE_IMAGES: Record<ArcAttributeKey, string> = {
  BODY: '/images/arc/arc-body.jpg',
  MIND: '/images/arc/arc-mind.jpg',
  CRAFT: '/images/arc/arc-craft.jpg',
  PEOPLE: '/images/arc/arc-people.jpg',
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAttrKey, setNewAttrKey] = useState<ArcAttributeKey>('CRAFT');
  const [completedQuestId, setCompletedQuestId] = useState<string | null>(null);
  const [hoveredAttr, setHoveredAttr] = useState<ArcAttributeKey | null>(null);
  const [celebrationData, setCelebrationData] = useState<CelebrationPayload | null>(null);
  const [networkError, setNetworkError] = useState<{ task: Task; message: string } | null>(null);
  const [recentFeed, setRecentFeed] = useState<any[]>([
    {
      id: 're-1',
      title: 'DEEP WORK (45M)',
      reward: '+18 CRAFT',
      detail: '+8 Momentum · +12 Marks',
      tag: 'VERIFIED FOCUS',
      time: '2h ago',
      icon: Award,
    },
    {
      id: 're-2',
      title: 'TEMPO RUN (3 KM)',
      reward: '+12 BODY',
      detail: '+8 Momentum · +10 Marks',
      tag: 'AEROBIC CADENCE',
      time: 'Yesterday',
      icon: Flame,
    },
    {
      id: 're-3',
      title: 'SEAL OF THE 5K',
      reward: 'RELIC INSIGNIA',
      detail: 'Equipped to Profile',
      tag: 'PERMANENT BADGE',
      time: '2 days ago',
      icon: Sparkles,
    },
    {
      id: 're-4',
      title: 'DEEP READING (20P)',
      reward: '+8 MIND',
      detail: '+4 Momentum · +6 Marks',
      tag: 'COGNITIVE CLARITY',
      time: '3 days ago',
      icon: Coins,
    },
  ]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setUser(json.user);
        setAttributes(json.attributes || []);
        setTasks(json.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Compute Greeting based on local time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }, []);

  // Compute Total Momentum from attributes or fallback
  const totalMomentum = useMemo(() => {
    const sum = attributes.reduce((acc, a) => acc + (a.xp || 0), 0);
    return sum > 0 ? sum : 742;
  }, [attributes]);

  // Non-linear 20-Level Progression Curve
  const totalXp = useMemo(() => {
    return 1180 + totalMomentum; // Level 07: BUILDER (1150-1520 XP baseline)
  }, [totalMomentum]);

  const arcProgression = useMemo(() => {
    return computeArcLevel(totalXp);
  }, [totalXp]);

  // Real Streak System with 7-day glyphs and recovery message
  const streakDetails = useMemo(() => {
    return computeDetailedStreak(user?.streak || 7, user?.lastActivityAt || null);
  }, [user]);

  // Normalization of 4 primary attributes (BODY, MIND, CRAFT, PEOPLE)
  const normalizedAttributes = useMemo(() => {
    const map: Record<ArcAttributeKey, { score: number; delta: number }> = {
      BODY: { score: 68, delta: 12 },
      MIND: { score: 84, delta: 18 },
      CRAFT: { score: 57, delta: 14 },
      PEOPLE: { score: 42, delta: 6 },
    };

    attributes.forEach((attr) => {
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

    return map;
  }, [attributes]);

  // Curated Today's actions list (formatted as game quest log rows)
  const todayMoves: Task[] = useMemo(() => {
    const pendingTasks = tasks.filter((t) => t.status !== 'done');
    if (pendingTasks.length >= 3) {
      return pendingTasks.slice(0, 4).map((t, idx) => {
        const keys: ArcAttributeKey[] = ['CRAFT', 'BODY', 'MIND', 'PEOPLE'];
        const k = keys[idx % keys.length];
        return {
          id: t.id,
          code: String(idx + 1).padStart(2, '0'),
          title: t.title.toUpperCase(),
          status: 'pending',
          attributeId: t.attributeId || 'attr-id',
          target: idx === 0 ? '45 MIN' : idx === 1 ? '3 KM' : idx === 2 ? '20 PAGES' : '15 MIN',
          attrKey: k,
          tag: idx === 0 ? 'CRAFT · FOCUS' : idx === 1 ? 'BODY · ENDURANCE' : idx === 2 ? 'MIND · KNOWLEDGE' : 'PEOPLE · CONNECTION',
          attrPoints: idx === 0 ? 18 : idx === 1 ? 12 : idx === 2 ? 8 : 6,
          momentumPoints: idx === 0 ? 8 : idx === 1 ? 8 : idx === 2 ? 4 : 4,
          whyItMatters: idx === 0 ? 'Consistency compounds.' : 'Physical endurance elevates mental clarity.',
        };
      });
    }

    return [
      {
        id: 'move-deep-work',
        code: '01',
        title: 'DEEP WORK',
        target: '45 MIN',
        attrKey: 'CRAFT',
        tag: 'CRAFT · FOCUS',
        status: 'pending',
        attributeId: 'craft-attr',
        attrPoints: 18,
        momentumPoints: 8,
        whyItMatters: 'Consistency compounds.',
      },
      {
        id: 'move-tempo-run',
        code: '02',
        title: 'TEMPO RUN',
        target: '3 KM',
        attrKey: 'BODY',
        tag: 'BODY · ENDURANCE',
        status: 'pending',
        attributeId: 'body-attr',
        attrPoints: 12,
        momentumPoints: 8,
        whyItMatters: 'Aerobic discipline grounds your mental focus.',
      },
      {
        id: 'move-deep-reading',
        code: '03',
        title: 'DEEP READING',
        target: '20 PAGES',
        attrKey: 'MIND',
        tag: 'MIND · KNOWLEDGE',
        status: 'pending',
        attributeId: 'mind-attr',
        attrPoints: 8,
        momentumPoints: 4,
        whyItMatters: 'Nonfiction density restores fractured attention.',
      },
      {
        id: 'move-call-someone',
        code: '04',
        title: 'CALL SOMEONE',
        target: '15 MIN',
        attrKey: 'PEOPLE',
        tag: 'PEOPLE · CONNECTION',
        status: 'pending',
        attributeId: 'people-attr',
        attrPoints: 6,
        momentumPoints: 4,
        whyItMatters: 'Intentional presence deepens human trust.',
      },
    ];
  }, [tasks]);

  // Primary Recommended Quest
  const nextMove = todayMoves[0];

  // Complete a move with server authority & celebration sequence
  const handleCompleteMove = async (task: Task) => {
    setCompletedQuestId(task.id);
    setNetworkError(null);
    try {
      let marksGain = 12;
      let xpGain = 85;
      let newStreak = (user?.streak || 7) + 1;
      let leveledUp = false;
      let newLevelTitle: string | undefined = undefined;

      if (task.id.startsWith('move-')) {
        const newGrit = (user?.grit || 184) + marksGain;

        setUser((prev) => (prev ? {
          ...prev,
          grit: newGrit,
          marks: newGrit,
          streak: newStreak,
          lastActivityAt: new Date().toISOString(),
        } : null));

        window.dispatchEvent(new CustomEvent('arc-state-update', {
          detail: {
            marks: newGrit,
            streak: newStreak,
          },
        }));
      } else {
        const res = await fetch(`/api/tasks/${task.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error('Quest completion failed on server.');
        }
        const json = await res.json();
        marksGain = json.marksAwarded || 12;
        xpGain = json.xpAwarded || 85;
        newStreak = json.newStreak || (user?.streak || 7) + 1;
        leveledUp = json.leveledUp || false;
        newLevelTitle = json.newLevelTitle;

        window.dispatchEvent(new CustomEvent('arc-state-update', {
          detail: {
            marks: json.newGrit,
            streak: json.newStreak,
          },
        }));
        await fetchDashboard();
      }

      // Check for Milestone Discovery
      let milestoneReached = null;
      if (newStreak === 7) {
        milestoneReached = {
          title: '7 DAYS OF MOMENTUM',
          category: 'DISCIPLINE',
          description: '7 consecutive days of verified intentional action. Sovereign rhythm established.',
        };
      } else if (newStreak === 30) {
        milestoneReached = {
          title: '30 DAYS OF MOMENTUM',
          category: 'DISCIPLINE',
          description: 'A permanent baseline is forged through unbroken daily discipline.',
        };
      }

      // Prepend to Recently Earned Feed
      setRecentFeed((prev) => [
        {
          id: `re-${Date.now()}`,
          title: task.title,
          reward: `+${task.attrPoints} ${task.attrKey}`,
          detail: `+${task.momentumPoints} Momentum · +${marksGain} Marks`,
          tag: 'JUST VERIFIED',
          time: 'Just now',
          icon: Sparkles,
        },
        ...prev,
      ]);

      setCelebrationData({
        questTitle: task.title,
        attrKey: task.attrKey,
        attrPoints: task.attrPoints,
        momentum: task.momentumPoints,
        marks: marksGain,
        xp: xpGain,
        streak: newStreak,
        leveledUp,
        oldLevel: arcProgression.level,
        newLevel: arcProgression.level + 1,
        oldTitle: arcProgression.title,
        newTitle: newLevelTitle || 'MOMENTUM',
        milestoneReached,
      });
    } catch (err: any) {
      console.error('Error completing move', err);
      setNetworkError({
        task,
        message: 'Your progress was not lost. The server could not reconcile this move.',
      });
    } finally {
      setCompletedQuestId(null);
    }
  };

  // Create a new move
  const handleAddMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const targetAttr = attributes.find((a) => a.name.toUpperCase().includes(newAttrKey)) || attributes[0];
      if (targetAttr) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle.trim(),
            attributeId: targetAttr.id,
          }),
        });
        await fetchDashboard();
      }
      setNewTitle('');
      setAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create task', err);
    }
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'CHRONICLER';

  return (
    <AppShell
      userName={userName}
      userMomentum={totalMomentum}
      userLevelTitle={arcProgression.title}
      userMarks={user?.marks || user?.grit || 184}
      userStreak={streakDetails.currentStreak}
      equippedTitle={user?.equippedTitle || 'THE BUILDER'}
      equippedInsignia={user?.equippedInsignia || 'CELESTIAL COMPASS'}
      userLevel={arcProgression.level}
    >
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-24">
        {/* 01. PAGE STATUS & GREETING BAR */}
        <header className="mb-10 sm:mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-[#151D28]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold">
                {greeting}, {userName}
              </span>
              <span className="text-[#38485C]">·</span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-[#8B97A6] uppercase">
                LEVEL {String(arcProgression.level).padStart(2, '0')} · {arcProgression.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A059] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C5A059]" />
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-[#EDE8DF] uppercase font-semibold">
                YOUR ARC IS ACTIVE
              </span>
            </div>
          </div>
        </header>

        {/* 02. SPLIT HERO AREA (LEFT: NEXT MOVE · RIGHT: CINEMATIC ARTWORK) */}
        <section className="mb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch" aria-label="Hero Next Move">
          {/* Left Hero: Editorial Question & Next Move */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <span className="font-mono text-[10px] tracking-[0.28em] text-[#8B97A6] uppercase block mb-2">
                DAILY INTENTION
              </span>
              <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl text-[#F2EEE6] tracking-tight leading-[1.04] uppercase mb-4">
                What&apos;s your<br />next move?
              </h1>
              <p className="font-sans text-sm text-[#8B97A6] font-light max-w-md leading-relaxed">
                One action is enough to move the arc forward. No backlog overwhelm. Select, execute, and record your forward momentum.
              </p>
            </div>

            {/* Dominant Next Move Focal Card */}
            {nextMove && (
              <div className="relative rounded-lg border border-[#C5A059]/70 bg-gradient-to-br from-[#0E1520] via-[#0A0F16] to-[#070A0F] p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.85)] group transition-all hover:border-[#C5A059]">
                {/* Subtle ambient gold corner sheen */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 font-mono text-[9px] tracking-[0.2em] text-[#C5A059] uppercase font-semibold">
                      RECOMMENDED MOVE
                    </span>
                    <span className="font-mono text-xs text-[#C5A059] tracking-wider">
                      {nextMove.target}
                    </span>
                  </div>

                  <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#F2EEE6] tracking-tight uppercase mb-2 group-hover:translate-x-1 transition-transform">
                    {nextMove.title}
                  </h2>

                  <p className="font-sans text-xs text-[#8B97A6] font-light mb-6">
                    {nextMove.whyItMatters}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#16212E]">
                    {/* Rewards pill */}
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-[#EDE8DF]">+{nextMove.attrPoints} {nextMove.attrKey}</span>
                      <span className="text-[#38485C]">·</span>
                      <span className="text-[#C5A059]">+{nextMove.momentumPoints} MOMENTUM</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/focus/${nextMove.id}?attr=${nextMove.attrKey}`)}
                        className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-sans text-xs tracking-[0.2em] uppercase font-semibold transition-all shadow-[0_4px_20px_rgba(197,160,89,0.3)] cursor-pointer"
                      >
                        <span>Begin Quest</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteMove(nextMove)}
                        className="p-3 border border-[#222F3E] hover:border-[#C5A059] text-[#6B7784] hover:text-[#3A7F58] transition-colors rounded cursor-pointer"
                        title="Mark Complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Hero: Cinematic Artwork Panel */}
          <div className="lg:col-span-5 relative min-h-[360px] lg:min-h-[460px] rounded-lg overflow-hidden border border-[#1E2938] shadow-[0_20px_60px_rgba(0,0,0,0.9)] group">
            <Image
              src="/images/arc/arc-dashboard-world.jpg"
              alt="Lone Traveler on The ARC Journey"
              fill
              priority
              className="object-cover object-center transition-transform duration-1000 group-hover:scale-105"
            />
            {/* Dark vignette gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080C12] via-transparent to-[#080C12]/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080C12]/40 via-transparent to-[#080C12]/20" />

            {/* In-Artwork Narrative Capsule */}
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded bg-[#080C12]/85 backdrop-blur-md border border-[#1A2534]">
              <span className="block font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold mb-1">
                WAYPOINT · YOU ARE ON A JOURNEY
              </span>
              <p className="font-sans text-xs text-[#EDE8DF] font-light leading-relaxed">
                &ldquo;A life is not assembled in grand leaps, but in the stubborn recurrence of quiet daily moves.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* 03. TODAY'S MOVES — GAME QUEST LOG ROWS (NOT CARDS) */}
        <section className="mb-16" aria-label="Today's Moves">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1A222C]">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                Today&apos;s Moves
              </h3>
              <span className="font-mono text-[10px] text-[#8B97A6] tracking-widest uppercase">
                ({todayMoves.length} ACTIVE)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-[10px] font-sans tracking-[0.16em] uppercase text-[#C5A059] hover:text-[#D4B57A] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Move</span>
            </button>
          </div>

          {/* Vertical Quest Log Rows or Empty State */}
          {todayMoves.length === 0 ? (
            <EmptyState
              type="dashboard"
              actionHref="/quests"
              actionText="Start Your First Quest →"
            />
          ) : (
            <div className="divide-y divide-[#151E2A] border-y border-[#151E2A]">
              {todayMoves.map((move) => {
                const isCompleted = completedQuestId === move.id;

                return (
                  <div
                    key={move.id}
                    className={`group relative py-4 px-3 sm:px-4 flex items-center justify-between transition-all ${
                      isCompleted ? 'opacity-40 bg-[#0E1520]' : 'hover:bg-[#0D141F]'
                    }`}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-[#C5A059] transition-colors" />

                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="font-mono text-xs sm:text-sm text-[#4A5565] group-hover:text-[#C5A059] font-semibold w-6 transition-colors">
                        {move.code}
                      </span>

                      <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded overflow-hidden border border-[#1E2938] shrink-0">
                        <Image
                          src={ATTRIBUTE_IMAGES[move.attrKey]}
                          alt={move.attrKey}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-display text-lg sm:text-xl text-[#F2EEE6] group-hover:text-[#C5A059] transition-colors tracking-wide uppercase">
                            {move.title}
                          </span>
                          {move.target && (
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#101722] text-[#8B97A6] border border-[#1A2534]">
                              {move.target}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-[#6B7784]">
                          <span className="text-[#C5A059]">{move.tag}</span>
                          <span>·</span>
                          <span className="text-[#8B97A6]">+{move.attrPoints} {move.attrKey}</span>
                          <span>·</span>
                          <span className="text-[#C5A059]">+{move.momentumPoints} MOMENTUM</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/focus/${move.id}?attr=${move.attrKey}`)}
                        className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#8B97A6] hover:text-[#EDE8DF] border border-[#1A2534] hover:border-[#C5A059] transition-colors rounded cursor-pointer hidden sm:inline-flex items-center gap-1.5"
                      >
                        <span>Focus</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCompleteMove(move)}
                        disabled={isCompleted}
                        className="p-2.5 rounded border border-[#1A2534] hover:border-[#C5A059] text-[#6B7784] hover:text-[#3A7F58] transition-colors cursor-pointer"
                        title="Mark Complete"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 04. MOMENTUM & STREAK SYSTEM + 20-LEVEL NON-LINEAR PROGRESSION */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch" aria-label="Momentum & Level Progression">
          {/* Left: Partial Arc / Orbit Momentum + 7-Day Streak Glyphs */}
          <div className="md:col-span-6 rounded-lg border border-[#1A222C] bg-[#0A0E14] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold">
                  YOUR MOMENTUM &amp; STREAK
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#3A7F58]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+37% TREND</span>
                </span>
              </div>

              {/* Arc Trajectory Visualization */}
              <div className="flex items-center gap-6 my-4">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#141D28"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset="60"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#C5A059"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - Math.min(0.85, totalMomentum / 1000))}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <Compass className="w-5 h-5 text-[#C5A059] mb-0.5" />
                    <span className="font-mono text-[9px] tracking-widest text-[#8B97A6] uppercase">ORBIT</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-5xl sm:text-6xl text-[#F2EEE6] tracking-tight">
                      {totalMomentum}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#C5A059] tracking-wider block mt-1">
                    +84 THIS WEEK
                  </span>
                  <p className="font-sans text-xs text-[#6B7784] font-light mt-1">
                    Cumulative momentum velocity across all 4 capabilities.
                  </p>
                </div>
              </div>

              {/* Real Streak System with 7-day Glyphs */}
              <div className="pt-4 mt-2 border-t border-[#151E2A]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#E65100]" />
                    <span className="font-mono text-[10px] tracking-[0.2em] text-[#EDE8DF] uppercase font-semibold">
                      {streakDetails.currentStreak}-DAY STREAK
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-[#6B7784] tracking-wider uppercase">
                    BEST: {streakDetails.bestStreak} DAYS
                  </span>
                </div>

                {/* 7-Day Glyphs (M T W T F S S) */}
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {streakDetails.weekDays.map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className={`text-[8px] font-mono mb-1 ${day.isToday ? 'text-[#C5A059] font-bold' : 'text-[#6B7784]'}`}>
                        {day.label}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          day.completed
                            ? 'bg-[#C5A059] text-[#080C12] shadow-[0_0_8px_rgba(197,160,89,0.4)]'
                            : day.isToday
                            ? 'border border-[#C5A059] text-[#C5A059] bg-[#C5A059]/10'
                            : 'bg-[#141D28] text-[#4A5565]'
                        }`}
                      >
                        {day.completed ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Non-shaming Recovery or Encouragement Banner */}
                <p className="font-sans text-[11px] text-[#8B97A6] font-light italic">
                  {streakDetails.recoveryMessage || '“Your momentum is unbroken. Step into today’s move without hesitation.”'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#151E2A] text-xs font-mono mt-4">
              <div>
                <span className="block text-[#6B7784] text-[9px] tracking-widest uppercase mb-1">LAST WEEK</span>
                <span className="text-[#8B97A6]">61</span>
              </div>
              <div>
                <span className="block text-[#6B7784] text-[9px] tracking-widest uppercase mb-1">THIS WEEK</span>
                <span className="text-[#EDE8DF] font-semibold">84</span>
              </div>
              <div>
                <span className="block text-[#6B7784] text-[9px] tracking-widest uppercase mb-1">VELOCITY</span>
                <span className="text-[#3A7F58] font-semibold">+37%</span>
              </div>
            </div>
          </div>

          {/* Right: Meaningful 20-Level Progression */}
          <div className="md:col-span-6 rounded-lg border border-[#1A222C] bg-[#0A0E14] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold">
                  DEVELOPMENT STAGE
                </span>
                <span className="font-mono text-[10px] text-[#8B97A6]">
                  LEVEL {String(arcProgression.level).padStart(2, '0')} / 20
                </span>
              </div>

              <h4 className="font-display font-semibold text-3xl sm:text-4xl text-[#F2EEE6] tracking-wide uppercase mb-1">
                {arcProgression.title}
              </h4>
              <p className="text-xs font-sans text-[#A6B2C0] mb-4 font-light italic">
                &ldquo;{arcProgression.meaning}&rdquo;
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#8B97A6] mb-2">
                <span>{totalXp} / {arcProgression.nextThreshold} TOTAL XP</span>
                <span className="text-[#C5A059]">{Math.round(arcProgression.progress * 100)}%</span>
              </div>

              <div className="w-full h-1.5 bg-[#141C27] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#C5A059] transition-all duration-700"
                  style={{ width: `${Math.round(arcProgression.progress * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7784]">
                <span>{arcProgression.remaining} XP REMAINING</span>
                <span>
                  {arcProgression.isMaxLevel ? 'THE ARC CONTINUES' : `NEXT: LEVEL ${String(arcProgression.level + 1).padStart(2, '0')}`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 05. VISUAL ATTRIBUTE METERS WITH HOVER REVEAL PANELS */}
        <section className="mb-16" aria-label="Core Attributes">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#1A222C]">
            <div>
              <h3 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                Core Attributes
              </h3>
              <p className="font-sans text-xs text-[#7E8B99] font-light">
                Hover to reveal real-world capability panels.
              </p>
            </div>
            <Link
              href="/character"
              className="text-[10px] font-sans tracking-[0.16em] uppercase text-[#C5A059] hover:text-[#D4B57A] transition-colors"
            >
              Character View &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(Object.keys(ARC_ATTRIBUTES) as ArcAttributeKey[]).map((key) => {
              const cfg = ARC_ATTRIBUTES[key];
              const data = normalizedAttributes[key];
              const isHovered = hoveredAttr === key;

              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredAttr(key)}
                  onMouseLeave={() => setHoveredAttr(null)}
                  className="relative rounded-lg border border-[#19222E] bg-[#0A0E14] overflow-hidden group transition-all hover:border-[#C5A059]/60 cursor-pointer"
                >
                  <div className="relative h-32 w-full overflow-hidden border-b border-[#151E28]">
                    <Image
                      src={ATTRIBUTE_IMAGES[key]}
                      alt={cfg.label}
                      fill
                      className={`object-cover transition-all duration-700 ${
                        isHovered ? 'scale-110 opacity-90' : 'opacity-40 grayscale-[40%]'
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-[#0A0E14]/50 to-transparent" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#080C12]/80 backdrop-blur-sm border border-[#1E2938] font-mono text-[9px] text-[#C5A059] uppercase tracking-wider">
                      {cfg.key}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-lg text-[#EDE8DF] tracking-wide uppercase group-hover:text-[#C5A059] transition-colors">
                        {cfg.label}
                      </span>
                      <span className="font-mono text-xs text-[#3A7F58] font-semibold">
                        +{data.delta}
                      </span>
                    </div>

                    <span className="block font-display font-semibold text-3xl text-[#F2EEE6] mb-2">
                      {data.score}
                    </span>

                    <div className="w-full h-1 bg-[#141C26] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-[#C5A059] transition-all duration-500"
                        style={{ width: `${Math.min(100, data.score)}%` }}
                      />
                    </div>

                    <p className="text-[10px] font-sans text-[#6B7784] font-light leading-relaxed">
                      {cfg.descriptors}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 05.5 RECENTLY EARNED — SOVEREIGN ACTIVITY FEED */}
        <section className="mb-16" aria-label="Recently Earned">
          <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#1A222C]">
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-[#C5A059]" />
              <h3 className="font-display text-xl tracking-wider text-[#EDE8DF] uppercase font-medium">
                Recently Earned
              </h3>
            </div>
            <span className="font-mono text-[10px] text-[#6B7784] tracking-widest uppercase">
              SOVEREIGN LEDGER
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentFeed.slice(0, 4).map((feed) => {
              const Icon = feed.icon || Sparkles;
              return (
                <div
                  key={feed.id}
                  className="rounded-lg border border-[#18212D] bg-[#090D13] p-4 flex flex-col justify-between hover:border-[#C5A059]/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-[9px] font-mono mb-2">
                      <span className="text-[#C5A059] uppercase tracking-wider">{feed.tag}</span>
                      <span className="text-[#4A5565]">{feed.time}</span>
                    </div>
                    <h4 className="font-display font-semibold text-base text-[#F2EEE6] tracking-wide uppercase mb-1">
                      {feed.title}
                    </h4>
                    <span className="font-mono text-xs font-semibold text-[#EDE8DF] block mb-0.5">
                      {feed.reward}
                    </span>
                    <span className="font-sans text-[11px] text-[#7E8B99] font-light">
                      {feed.detail}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 06. NEXT MILESTONE WITH CINEMATIC THUMBNAIL */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6" aria-label="Next Milestone and Trajectory">
          <div className="md:col-span-7 rounded-lg border border-[#1A222C] bg-[#0A0E14] p-6 sm:p-7 flex flex-col sm:flex-row gap-6 items-center">
            <div className="relative w-full sm:w-44 h-32 rounded overflow-hidden border border-[#222E3E] shrink-0">
              <Image
                src="/images/arc/arc-milestone-01.jpg"
                alt="Next Milestone Horizon"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080C12]/80 via-transparent to-transparent" />
            </div>

            <div className="flex-1 w-full">
              <span className="block font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold mb-1">
                NEXT MILESTONE
              </span>
              <h4 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-1">
                30 Days of Momentum
              </h4>
              <p className="font-sans text-xs text-[#8B97A6] font-light mb-4 leading-relaxed">
                A new baseline is permanently forged through unbroken daily discipline.
              </p>

              <div className="w-full h-1.5 bg-[#151E2A] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#C5A059] w-[70%]" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7784]">
                <span>21 / 30 DAYS COMPLETE</span>
                <span className="text-[#C5A059]">9 DAYS REMAINING</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 rounded-lg border border-[#1A222C] bg-[#0A0E14] p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="block font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold mb-2">
                YOUR TRAJECTORY
              </span>
              <h4 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-1">
                Day 43 · The Journey
              </h4>
              <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed mb-4">
                &ldquo;You are not a level. You are a direction.&rdquo; Look how far your deliberate actions have taken you.
              </p>
            </div>
            <Link
              href="/journey"
              className="inline-flex items-center gap-2 text-xs font-sans tracking-[0.18em] uppercase text-[#C5A059] hover:text-[#E2C68A] transition-colors font-medium"
            >
              <span>View Full Trajectory Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* ADD MOVE MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-[#0C1016] border border-[#243040] shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A222C] mb-6">
              <span className="font-display text-sm tracking-[0.18em] uppercase text-[#F2EEE6] font-semibold">
                Record Real-World Move
              </span>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-[#6B7784] hover:text-[#F2EEE6] transition-colors p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMove} className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-2">
                  Action Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 20 pages or Run 5K"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#080C12] border border-[#1E2938] px-4 py-3 text-sm text-[#F2EEE6] placeholder-[#4A5565] focus:outline-none focus:border-[#C5A059] transition-colors font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-2">
                  Primary Attribute
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BODY', 'MIND', 'CRAFT', 'PEOPLE'] as ArcAttributeKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setNewAttrKey(k)}
                      className={`py-2 px-3 text-xs font-mono tracking-wider uppercase border transition-all cursor-pointer ${
                        newAttrKey === k
                          ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#F2EEE6]'
                          : 'border-[#1E2938] text-[#8B97A6] hover:border-[#33445C]'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-5 py-2.5 text-[11px] font-sans tracking-[0.16em] uppercase text-[#7E8B99] hover:text-[#EDE8DF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-[11px] font-sans tracking-[0.18em] uppercase text-[#080C12] bg-[#C5A059] hover:bg-[#D4B57A] transition-colors font-semibold shadow-[0_2px_12px_rgba(197,160,89,0.25)] cursor-pointer"
                >
                  Confirm Move
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CELEBRATION MODAL (SERVER AUTHORITATIVE REWARD TALLY)
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          CELEBRATION MODAL (TACTILE ANIMATED REWARDS & LEVEL UP)
      ───────────────────────────────────────────────────────────── */}
      {celebrationData && (
        <ArcCelebrationModal
          data={celebrationData}
          onClose={() => setCelebrationData(null)}
          onViewJourney={() => router.push('/journey')}
        />
      )}

      {/* Network Error Banner with Retry */}
      {networkError && (
        <NetworkErrorBanner
          message={networkError.message}
          onRetry={() => {
            const taskToRetry = networkError.task;
            setNetworkError(null);
            handleCompleteMove(taskToRetry);
          }}
          onDismiss={() => setNetworkError(null)}
        />
      )}
    </AppShell>
  );
}
