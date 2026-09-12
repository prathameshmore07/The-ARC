'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ChronoDial from '@/components/ChronoDial';
import LevelUpOverlay, { LevelUpData } from '@/components/LevelUpOverlay';
import { ChevronRight, Skull, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
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
      if (!res.ok) throw new Error('Failed to load ledger');
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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] p-6">
        <div className="max-w-4xl mx-auto space-y-4 pt-12">
          <div className="h-10 bg-[var(--page-bone)]/10 rounded-lg w-48 animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-[var(--page-bone)]/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] flex items-center justify-center p-4">
        <div className="bg-[var(--page-bone)] p-8 rounded-2xl parchment-shadow max-w-sm w-full text-center text-[var(--fresh-ink)]">
          <h2 className="font-serif font-bold text-xl mb-2">Chronicle Offline</h2>
          <p className="text-xs text-[var(--fresh-ink)]/70 mb-6">{error || 'Unable to open ledger'}</p>
          <button
            onClick={fetchDashboardData}
            className="px-5 py-2.5 bg-[var(--brass)] text-[var(--ink-navy)] font-serif font-bold rounded-xl text-xs"
          >
            Re-read Ledger
          </button>
        </div>
      </div>
    );
  }

  const totalLevel = data.attributes.reduce((sum, a) => sum + a.level, 0);
  const totalXp = data.attributes.reduce((sum, a) => sum + a.xp, 0);
  const activeShadow = data.attributes.find((a) => a.shadow && !a.shadow.defeatedAt);
  const hasActiveShadow = !!activeShadow;

  return (
    <div className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex flex-col pb-24 md:pb-12">
      {/* Top Persistent Navigation (Section 3.14) */}
      <Navigation
        totalLevel={totalLevel}
        totalXp={totalXp}
        grit={data.user.grit}
        hasActiveShadow={hasActiveShadow}
        activeShadowAttrId={activeShadow ? activeShadow.id : null}
      />

      {/* Main Ledger Content (Section 3.5) */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Ledger Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[var(--page-bone)]">
              Your Ledger
            </h1>
            <p className="text-xs text-[var(--page-bone-dim)] mt-1">
              Select an entry to view its quest board, or confront an active shadow.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Diegetic Chrono Dial Fast-Forward Lever */}
            <ChronoDial onFastForward={handleFastForward} />
          </div>
        </div>

        {/* Vertical Ledger List of Attributes */}
        <div className="space-y-5" role="feed" aria-label="Living Ledger Entries">
          {data.attributes.map((attr) => {
            const shadow = attr.shadow;
            const isShadowed = !!shadow;
            const attrTasks = data.tasks.filter((t) => t.attributeId === attr.id);
            const pendingTasksCount = attrTasks.filter((t) => t.status !== 'done').length;

            const msSinceActivity = Date.now() - new Date(attr.lastActivityAt).getTime();
            const daysNeglected = Math.max(1, Math.floor(msSinceActivity / (1000 * 60 * 60 * 24)));
            const originStory = shadow
              ? getShadowOriginStory(shadow.baselineWeeklyRate || 0, daysNeglected)
              : null;

            return (
              <div
                key={attr.id}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                  isShadowed ? 'stained-shadow bg-[var(--stain)]' : 'parchment-shadow bg-[var(--page-bone)]'
                }`}
              >
                {/* Torn Deckle Bottom Edge */}
                <div
                  className={`p-6 sm:p-7 ledger-deckle-edge transition-colors duration-300 relative ${
                    isShadowed
                      ? 'bg-[var(--stain)] text-[var(--page-bone)]'
                      : 'bg-[var(--page-bone)] text-[var(--fresh-ink)]'
                  }`}
                >
                  {/* Ink Stain SVG Bleed Overlay with feTurbulence Filter (Section 3.5 & 3.8) */}
                  {isShadowed && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                      <svg viewBox="0 0 500 200" className="w-full h-full opacity-35" preserveAspectRatio="none">
                        <filter id={`turb-${attr.id}`}>
                          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                          <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                        <rect width="100%" height="100%" fill="#16131A" filter={`url(#turb-${attr.id})`} />
                      </svg>
                    </div>
                  )}

                  {/* Entry Header */}
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-current/15">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/attribute/${attr.id}`}
                          className="font-serif font-bold text-2xl sm:text-3xl hover:text-[var(--brass)] transition-colors inline-flex items-center gap-2 group"
                        >
                          <span>{attr.name}</span>
                          <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                        </Link>

                        <span className="text-xs font-serif font-semibold px-2.5 py-0.5 rounded-full border border-current/25">
                          {getLevelTitle(attr.level)}
                        </span>
                      </div>

                      {/* Stat Stamps: Level & Streak */}
                      <div className="flex items-center gap-4 text-xs font-serif">
                        <div>
                          <span className="opacity-60 mr-1">Level</span>
                          <span className="font-bold text-base">{attr.level}</span>
                        </div>
                        <div className="h-3 w-px bg-current/20" />
                        <div>
                          <span className="opacity-60 mr-1">Streak</span>
                          <span className="font-bold">{attr.streak}d</span>
                        </div>
                      </div>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-current/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${
                            isShadowed ? 'bg-red-400' : 'bg-[var(--brass)]'
                          }`}
                          style={{ width: `${Math.round(attr.progress * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-sans opacity-70 whitespace-nowrap">
                        {attr.xp} / {attr.xpForNextLevel} XP
                      </span>
                    </div>

                    {/* Shadow Entity Section (if shadowed) */}
                    {isShadowed && shadow ? (
                      <div className="mt-4 p-4 rounded-xl bg-black/40 border border-red-500/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Skull className="w-4 h-4 text-red-400" aria-hidden="true" />
                            <span className="font-serif font-bold text-sm text-[var(--page-bone)]">
                              Shadow Active · HP {shadow.hp}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                              -20% XP Tax
                            </span>
                          </div>

                          {/* Seal Steps Row */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-serif text-[var(--brass-bright)]">Seal:</span>
                            <div className="flex items-center gap-1.5" aria-label={`Banishing seal step ${shadow.sealProgress} of ${shadow.stepsNeeded}`}>
                              {Array.from({ length: shadow.stepsNeeded }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-full border transition-all ${
                                    i < shadow.sealProgress
                                      ? 'bg-[var(--reclaim)] border-[var(--reclaim)] shadow-[0_0_6px_rgba(107,143,113,0.8)]'
                                      : 'bg-black/60 border-current/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-mono text-xs opacity-80">
                              {shadow.sealProgress}/{shadow.stepsNeeded}
                            </span>
                          </div>
                        </div>

                        {originStory && (
                          <p className="text-xs italic text-[var(--page-bone-dim)] font-serif mb-3">
                            "{originStory}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                          <span className="text-xs text-[var(--page-bone-dim)]">
                            {pendingTasksCount} quests available to forge counter-attack
                          </span>
                          <Link
                            href={`/attribute/${attr.id}/confront`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-xs transition-colors shadow-sm"
                          >
                            <span>Confront Shadow</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      /* Healthy Entry Action Footer */
                      <div className="mt-4 flex items-center justify-between pt-2 border-t border-current/10">
                        <span className="text-xs opacity-70">
                          {pendingTasksCount === 0
                            ? 'No active quests recorded.'
                            : `${pendingTasksCount} active quest${pendingTasksCount === 1 ? '' : 's'}`}
                        </span>
                        <Link
                          href={`/attribute/${attr.id}`}
                          className="inline-flex items-center gap-1 text-xs font-serif font-bold hover:text-[var(--brass)] transition-colors"
                        >
                          <span>Open Quest Board</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Level-Up Celebration Overlay (Section 3.10) */}
      <LevelUpOverlay
        levelUp={levelUpData}
        onDismiss={() => setLevelUpData(null)}
      />
    </div>
  );
}
