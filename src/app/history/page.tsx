'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { CheckCircle, Zap } from 'lucide-react';

interface Completion {
  id: string;
  xpAwarded: number;
  gritAwarded: number;
  focusVerified: boolean;
  completedAt: string;
  task: {
    title: string;
    attribute: {
      name: string;
    };
  };
}

export default function HistoryPage() {
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

  const completions: Completion[] = data.completions || [];
  const totalLevel = data.attributes?.reduce((sum: number, a: any) => sum + a.level, 0) || 1;
  const totalXp = data.attributes?.reduce((sum: number, a: any) => sum + a.xp, 0) || 0;
  const activeShadow = data.attributes?.find((a: any) => a.shadow && !a.shadow.defeatedAt);

  // Group completions by day (Section 3.12)
  const groupedByDay: { [dateStr: string]: Completion[] } = {};
  for (const comp of completions) {
    const d = new Date(comp.completedAt);
    const dateKey = d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groupedByDay[dateKey]) {
      groupedByDay[dateKey] = [];
    }
    groupedByDay[dateKey].push(comp);
  }

  const dayKeys = Object.keys(groupedByDay);

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[var(--text-headline)]">
            Chronicle History
          </h1>
          <p className="text-xs text-[var(--text-dim)] mt-1">
            Reverse-chronological log of completed quests and deep focus sessions.
          </p>
        </div>

        {/* Grouped Days Log */}
        {dayKeys.length === 0 ? (
          <div className="bg-[var(--bg-surface-1)] p-8 rounded-2xl border border-[var(--border-subtle)] text-center text-sm text-[var(--text-dim)]">
            No entries inscribed yet. Complete a quest to start building your chronicle.
          </div>
        ) : (
          <div className="space-y-8">
            {dayKeys.map((day) => (
              <section key={day} aria-labelledby={`date-header-${day}`}>
                <h2
                  id={`date-header-${day}`}
                  className="font-serif font-bold text-base text-[var(--accent-amber)] pb-2 mb-3 border-b border-[var(--border-subtle)]"
                >
                  {day}
                </h2>

                <div className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-rpg-sm">
                  {groupedByDay[day].map((entry) => (
                    <div
                      key={entry.id}
                      className="px-4 py-3.5 flex items-center justify-between text-sm hover:bg-[var(--bg-surface-2)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-[var(--accent-forest)] flex-shrink-0" aria-hidden="true" />
                        <div>
                          <span className="font-medium text-[var(--text-headline)]">{entry.task.title}</span>
                          <span className="text-xs text-[var(--text-dim)] ml-2">
                            ({entry.task.attribute.name})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {entry.focusVerified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--accent-slate)]/20 text-sky-300 border border-[var(--accent-slate)]/40 font-serif">
                            <Zap className="w-3 h-3" aria-hidden="true" />
                            <span>Server-Timed</span>
                          </span>
                        )}
                        <span className="font-mono font-bold text-[var(--accent-amber)]">
                          +{entry.xpAwarded} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
