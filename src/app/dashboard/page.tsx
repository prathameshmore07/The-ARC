'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ChronoDial from '@/components/ChronoDial';
import LevelUpOverlay, { LevelUpData } from '@/components/LevelUpOverlay';
import { 
  Brain, 
  Dumbbell, 
  Compass, 
  Palette, 
  Flame, 
  ShieldAlert, 
  Skull, 
  ArrowRight, 
  ChevronRight, 
  Sparkles,
  Zap,
  Clock,
  Plus
} from 'lucide-react';
import { getLevelTitle, getShadowOriginStory } from '@/lib/game-engine';

interface ShadowData {
  id: string;
  hp: number;
  baselineWeeklyRate: number;
  stealRate: number;
  sealProgress: number;
  stepsNeeded: number;
  defeatedAt?: string | null;
}

interface AttributeData {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  lastActivityAt: string;
  decayStatus: 'stable' | 'vulnerable' | 'decaying';
  progress: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpBoostUntil: string | null;
  shadow: ShadowData | null;
}

interface TaskData {
  id: string;
  title: string;
  status: string;
  attributeId: string;
}

interface DashboardData {
  user: {
    id: string;
    name: string | null;
    email: string;
    grit: number;
  };
  attributes: AttributeData[];
  tasks: TaskData[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load chronicle');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error reading chronicle');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleFastForward = async (days: number) => {
    await fetch('/api/cron/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    await fetchDashboardData();
  };

  const getAttributeIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('intellect') || lower.includes('code') || lower.includes('mind')) return Brain;
    if (lower.includes('strength') || lower.includes('body') || lower.includes('gym')) return Dumbbell;
    if (lower.includes('discipline') || lower.includes('focus')) return Compass;
    return Palette;
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-6">
        <div className="max-w-6xl mx-auto space-y-6 pt-12">
          <div className="h-44 bg-[var(--bg-surface-1)] rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-[var(--bg-surface-1)] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
        <div className="bg-[var(--bg-surface-1)] p-8 rounded-2xl shadow-rpg-md max-w-sm w-full text-center text-[var(--text-body)] border border-[var(--border-subtle)]">
          <h2 className="font-serif font-bold text-xl mb-2 text-[var(--text-headline)]">Chronicle Offline</h2>
          <p className="text-xs text-[var(--text-dim)] mb-6">{error || 'Unable to open chronicle'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-5 py-2.5 bg-[var(--accent-slate)] text-white font-serif font-bold rounded-xl text-xs"
          >
            Re-sync Chronicle
          </button>
        </div>
      </div>
    );
  }

  const totalLevel = data.attributes.reduce((sum, a) => sum + a.level, 0);
  const totalXp = data.attributes.reduce((sum, a) => sum + a.xp, 0);
  const activeShadow = data.attributes.find((a) => a.shadow && !a.shadow.defeatedAt);
  const hasActiveShadow = !!activeShadow;
  const maxStreak = Math.max(...data.attributes.map((a) => a.streak), 1);

  // Calculate overall level XP bracket
  const xpForNextLevel = totalLevel * 250;
  const currentLevelProgress = Math.min(100, Math.round((totalXp % 250) / 2.5));

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col pb-24 md:pb-12">
      {/* Top Persistent Navigation */}
      <Navigation
        totalLevel={totalLevel}
        totalXp={totalXp}
        grit={data.user.grit}
        hasActiveShadow={hasActiveShadow}
        activeShadowAttrId={activeShadow ? activeShadow.id : null}
        streakDays={maxStreak}
      />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Hero Level Card (WANDR & Crownfall guidance: Answer number -> Supporting -> Detail) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-rpg-md mb-8 relative overflow-hidden">
          {/* Subtle background gradient glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-slate-700/10 via-transparent to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-6">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs uppercase tracking-wider text-[var(--accent-amber)] font-bold">
                  {getLevelTitle(totalLevel)}
                </span>
                <span className="text-[var(--text-faint)]">·</span>
                <span className="text-xs text-[var(--text-dim)]">{data.user.name || 'Chronicler'}</span>
              </div>
              <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[var(--text-headline)] tracking-tight">
                Level {totalLevel}
              </h1>
            </div>

            {/* Fast-Forward Chrono Dial */}
            <div className="flex items-center gap-3">
              <ChronoDial onFastForward={handleFastForward} />
            </div>
          </div>

          {/* XP Progress Bar (Track #1F2937, Gradient Fill, Smooth Spring) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[var(--text-dim)] font-medium">Overall Progress</span>
              <span className="font-serif font-bold text-[var(--accent-amber)]">
                {totalXp} / {xpForNextLevel} XP ({currentLevelProgress}%)
              </span>
            </div>
            <div className="h-3.5 bg-[#1F2937] rounded-full overflow-hidden p-0.5 border border-[var(--border-subtle)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-slate)] to-[var(--accent-amber)] transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(6, currentLevelProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Grid: Stat Cards + Right Rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 4 Stat Cards (Col-span 2) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif font-bold text-xl text-[var(--text-headline)]">
                Core Disciplines
              </h2>
              <span className="text-xs text-[var(--text-dim)]">
                Neglect triggers decay after 48h
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.attributes.map((attr) => {
                const shadow = attr.shadow;
                const isShadowed = !!shadow;
                const Icon = getAttributeIcon(attr.name);
                const attrTasks = data.tasks.filter((t) => t.attributeId === attr.id);
                const pendingTasksCount = attrTasks.filter((t) => t.status !== 'done').length;

                const msSinceActivity = Date.now() - new Date(attr.lastActivityAt).getTime();
                const hoursNeglected = Math.floor(msSinceActivity / (1000 * 60 * 60));
                const daysNeglected = Math.max(1, Math.floor(hoursNeglected / 24));
                const originStory = shadow
                  ? getShadowOriginStory(shadow.baselineWeeklyRate || 0, daysNeglected)
                  : null;

                return (
                  <div
                    key={attr.id}
                    className={`p-5 rounded-xl transition-all duration-200 flex flex-col justify-between ${
                      isShadowed
                        ? 'bg-[var(--bg-surface-1)] border-2 border-[var(--accent-brick)]/60 shadow-legendary'
                        : 'bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] shadow-rpg-sm'
                    }`}
                  >
                    <div>
                      {/* Card Header: Icon + Name + Decay Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                              isShadowed
                                ? 'bg-red-950/40 border-red-500/40 text-red-400'
                                : 'bg-[var(--bg-surface-2)] border-[var(--border-subtle)] text-[var(--accent-slate)]'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <Link
                              href={`/attribute/${attr.id}`}
                              className="font-serif font-bold text-lg text-[var(--text-headline)] hover:text-[var(--accent-amber)] transition-colors flex items-center gap-1 group"
                            >
                              <span>{attr.name}</span>
                              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                            <span className="text-xs text-[var(--text-dim)]">
                              Level {attr.level} · {getLevelTitle(attr.level)}
                            </span>
                          </div>
                        </div>

                        {/* Decay Status Pill */}
                        {isShadowed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/90 text-red-300 border border-red-800 animate-pulse">
                            <Skull className="w-3 h-3 text-red-400" />
                            Shadow
                          </span>
                        ) : hoursNeglected >= 36 ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/60">
                            Decaying
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/40">
                            Safe
                          </span>
                        )}
                      </div>

                      {/* Stat XP Progress */}
                      <div className="space-y-1.5 my-3">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[var(--text-faint)]">XP</span>
                          <span className="text-[var(--text-dim)] font-medium">
                            {attr.xp} / {attr.xpForNextLevel}
                          </span>
                        </div>
                        <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isShadowed
                                ? 'bg-red-400'
                                : 'bg-gradient-to-r from-[var(--accent-slate)] to-[var(--accent-amber)]'
                            }`}
                            style={{ width: `${Math.round(attr.progress * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Shadow Warning or Lore */}
                      {isShadowed && shadow && (
                        <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40 my-3 text-xs">
                          <div className="flex items-center justify-between text-red-200 font-bold mb-1">
                            <span>Shadow HP {shadow.hp}</span>
                            <span className="text-[10px] text-red-400">-20% XP Tax</span>
                          </div>
                          {originStory && (
                            <p className="text-[11px] text-red-200/80 italic line-clamp-2">
                              &ldquo;{originStory}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                      <span className="text-[var(--text-faint)]">
                        {pendingTasksCount} active quest{pendingTasksCount === 1 ? '' : 's'}
                      </span>
                      {isShadowed ? (
                        <Link
                          href={`/attribute/${attr.id}/confront`}
                          className="inline-flex items-center gap-1.5 font-serif font-bold text-xs px-3 py-1.5 rounded-lg bg-[var(--accent-brick)] hover:bg-red-700 text-white shadow-sm transition-colors"
                        >
                          <Skull className="w-3.5 h-3.5" />
                          <span>Confront</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/attribute/${attr.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[var(--accent-amber)] hover:text-amber-300 transition-colors"
                        >
                          <span>Open Quests</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Rail: Streak Flame + Active Buffs + Quick Actions */}
          <div className="space-y-6">
            {/* Streak Flame Module */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-rpg-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400 fill-orange-400 animate-pulse" />
                  <h3 className="font-serif font-bold text-lg text-[var(--text-headline)]">Streak Momentum</h3>
                </div>
                <span className="font-serif font-bold text-2xl text-orange-400">{maxStreak}d</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-4">
                Maintain activity in all disciplines to preserve your streak multiplier. At 7 days, unlock the Vanguard Flame.
              </p>
              <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  style={{ width: `${Math.min(100, (maxStreak / 7) * 100)}%` }}
                />
              </div>
            </div>

            {/* Active Buffs Module */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-rpg-sm">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[var(--accent-amber)]" />
                <h3 className="font-serif font-bold text-base text-[var(--text-headline)]">Active Buffs</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <div>
                      <div className="font-semibold text-[var(--text-headline)]">Battle Resolve</div>
                      <div className="text-[10px] text-[var(--text-dim)]">+10% XP on focus sessions</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--accent-amber)] font-medium">38h</span>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-semibold text-[var(--text-headline)]">Obsidian Ledger</div>
                      <div className="text-[10px] text-[var(--text-dim)]">Armory relic equipped</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                </div>
              </div>

              <Link
                href="/armory"
                className="mt-4 block text-center py-2 px-3 rounded-lg bg-[var(--bg-surface-2)] hover:bg-[var(--border-subtle)] text-xs font-semibold text-[var(--text-body)] transition-colors"
              >
                Visit Armory & Shop
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Level-Up Celebration Overlay */}
      <LevelUpOverlay
        levelUp={levelUpData}
        onDismiss={() => setLevelUpData(null)}
      />
    </div>
  );
}
