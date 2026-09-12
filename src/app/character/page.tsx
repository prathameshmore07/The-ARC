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
    <div className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex flex-col pb-24 md:pb-12">
      <Navigation
        totalLevel={totalLevel}
        totalXp={totalXp}
        grit={data.user?.grit || 0}
        hasActiveShadow={!!activeShadow}
        activeShadowAttrId={activeShadow?.id}
      />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Character Title & Level Header (Section 3.11) */}
        <div className="bg-[var(--page-bone)] text-[var(--fresh-ink)] p-8 rounded-2xl parchment-shadow border border-[var(--line)] mb-8">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-[var(--brass)] block mb-1">
            Character Ledger
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--line)] pb-4">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl tracking-tight">
              {characterTitle}
            </h1>
            <div className="text-left sm:text-right">
              <span className="font-serif font-bold text-xl block">
                Total Level {totalLevel}
              </span>
              <span className="text-xs text-[var(--fresh-ink)]/70">
                {totalXp} Accumulated XP
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--fresh-ink)]/80 mt-4 leading-relaxed font-serif">
            A living record of your four foundational pillars. Neglect allows the ink stain to bleed; consistency maintains sharp inscription.
          </p>
        </div>

        {/* 4 Attributes with Bars & Activity Lines (Section 3.11) */}
        <div className="space-y-4">
          {data.attributes?.map((attr: any) => {
            const attrTasks = data.tasks?.filter((t: any) => t.attributeId === attr.id) || [];
            const completedCount = attrTasks.filter((t: any) => t.status === 'done').length;

            return (
              <div
                key={attr.id}
                className="bg-[var(--page-bone)] text-[var(--fresh-ink)] p-6 rounded-xl parchment-shadow border border-[var(--line)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif font-bold text-xl">{attr.name}</h2>
                    <span className="text-xs font-serif font-semibold px-2 py-0.5 rounded border border-[var(--line)] text-[var(--fresh-ink)]/80">
                      {getLevelTitle(attr.level)}
                    </span>
                  </div>

                  <div className="text-xs font-serif font-bold text-[var(--brass)]">
                    Level {attr.level}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-[var(--page-bone-dim)] rounded-full overflow-hidden border border-[var(--line)] mb-3">
                  <div
                    className="h-full bg-[var(--brass)]"
                    style={{ width: `${Math.round((attr.progress || 0) * 100)}%` }}
                  />
                </div>

                {/* One line of history per attribute (Section 3.11) */}
                <div className="flex items-center justify-between text-xs text-[var(--fresh-ink)]/70 font-sans">
                  <span>
                    +{attr.xp} XP total · {completedCount} quests completed · {attr.streak}d streak
                  </span>
                  <span className="font-mono text-[11px] opacity-80">
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
