'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { getLevelTitle } from '@/lib/game-engine';

export default function CharacterPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] p-6">
        <div className="max-w-3xl mx-auto space-y-4 pt-12">
          <div className="h-8 bg-[var(--page-bone)]/10 rounded w-48 animate-pulse" />
          <div className="h-64 bg-[var(--page-bone)]/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const totalLevel = data.attributes?.reduce((sum: number, a: any) => sum + a.level, 0) || 1;
  const totalXp = data.attributes?.reduce((sum: number, a: any) => sum + a.xp, 0) || 0;

  // Derive title deterministically from highest XP attribute (Section 3.11)
  const sortedByXp = [...(data.attributes || [])].sort((a: any, b: any) => b.xp - a.xp);
  const primaryAttrName = sortedByXp[0]?.name?.toLowerCase() || 'intellect';
  let characterTitle = 'The Chronicler';
  if (primaryAttrName.includes('intellect') || primaryAttrName.includes('mind') || primaryAttrName.includes('study')) {
    characterTitle = 'The Scholar';
  } else if (primaryAttrName.includes('strength') || primaryAttrName.includes('body') || primaryAttrName.includes('iron')) {
    characterTitle = 'The Titan';
  } else if (primaryAttrName.includes('discipline') || primaryAttrName.includes('routine') || primaryAttrName.includes('will')) {
    characterTitle = 'The Ascetic';
  } else if (primaryAttrName.includes('creativity') || primaryAttrName.includes('craft') || primaryAttrName.includes('art')) {
    characterTitle = 'The Artisan';
  }

  const activeShadow = data.attributes?.find((a: any) => a.shadow && !a.shadow.defeatedAt);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col pb-24 md:pb-12">
      <Navigation
        totalLevel={totalLevel}
        totalXp={totalXp}
        grit={data.user?.grit || 0}
        hasActiveShadow={!!activeShadow}
        activeShadowAttrId={activeShadow?.id}
      />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Character Title & Level Header */}
        <div className="bg-[var(--bg-surface-1)] p-6 sm:p-8 rounded-2xl shadow-rpg-md border border-[var(--border-subtle)] mb-8">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-[var(--accent-amber)] block mb-1">
            Character Ledger
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[var(--text-headline)] tracking-tight">
              {characterTitle}
            </h1>
            <div className="text-left sm:text-right">
              <span className="font-serif font-bold text-xl text-[var(--accent-amber)] block">
                Total Level {totalLevel}
              </span>
              <span className="text-xs text-[var(--text-dim)]">
                {totalXp} Accumulated XP
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-dim)] mt-4 leading-relaxed font-sans">
            A living record of your four foundational disciplines. Neglect causes creeping stat decay; consistency builds permanent power.
          </p>
        </div>

        {/* 4 Attributes with Bars & Activity Lines */}
        <div className="space-y-4">
          {data.attributes?.map((attr: any) => {
            const attrTasks = data.tasks?.filter((t: any) => t.attributeId === attr.id) || [];
            const completedCount = attrTasks.filter((t: any) => t.status === 'done').length;

            return (
              <div
                key={attr.id}
                className="bg-[var(--bg-surface-1)] p-5 rounded-xl shadow-rpg-sm border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif font-bold text-lg text-[var(--text-headline)]">{attr.name}</h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-dim)]">
                      {getLevelTitle(attr.level)}
                    </span>
                  </div>

                  <div className="text-xs font-serif font-bold text-[var(--accent-amber)]">
                    Level {attr.level}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 bg-[#1F2937] rounded-full overflow-hidden border border-[var(--border-subtle)] mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent-slate)] to-[var(--accent-amber)]"
                    style={{ width: `${Math.round((attr.progress || 0) * 100)}%` }}
                  />
                </div>

                {/* History Line */}
                <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
                  <span>
                    +{attr.xp} XP total · {completedCount} quests completed · {attr.streak}d streak
                  </span>
                  <span className="text-[11px] text-[var(--text-faint)]">
                    Next at {attr.xpForNextLevel} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
