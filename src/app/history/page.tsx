'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/shell/AppShell';
import { CheckCircle2, Clock, Zap, ArrowRight } from 'lucide-react';

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
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completions: Completion[] = data?.completions || [];

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
    <AppShell>
      <div className="max-w-[1080px] mx-auto px-6 lg:px-12 pt-10 pb-20">
        <header className="mb-10">
          <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-2">
            ACTION LOG
          </span>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl text-[#F2EEE6] tracking-tight uppercase mb-3">
            Completed Moves
          </h1>
          <p className="font-sans text-sm text-[#8B97A6] font-light max-w-xl">
            A chronological record of verified real-world actions, workouts, and deep focus rituals.
          </p>
        </header>

        {dayKeys.length === 0 ? (
          <div className="bg-[#0C121B] p-12 rounded-lg border border-[#1E2938] text-center">
            <h3 className="font-display text-2xl text-[#EDE8DF] uppercase mb-2">No moves logged yet</h3>
            <p className="font-sans text-xs text-[#8B97A6] mb-6">
              Your ARC begins with one move. Choose a quest and record your forward momentum.
            </p>
            <Link
              href="/quests"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] text-[#080C12] text-xs font-sans tracking-[0.18em] uppercase font-semibold rounded"
            >
              <span>Explore Quests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {dayKeys.map((day) => (
              <section key={day}>
                <h2 className="font-mono text-xs text-[#C5A059] uppercase tracking-widest pb-2 mb-3 border-b border-[#1A222C]">
                  {day}
                </h2>

                <div className="divide-y divide-[#151E2A] bg-[#0A0E14] rounded-lg border border-[#1A222C] overflow-hidden">
                  {groupedByDay[day].map((entry) => (
                    <div
                      key={entry.id}
                      className="px-5 py-4 flex items-center justify-between text-sm hover:bg-[#0C121B] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-[#3A7F58] shrink-0" />
                        <div>
                          <span className="font-display text-base text-[#F2EEE6] uppercase tracking-wide">
                            {entry.task.title}
                          </span>
                          <span className="text-[10px] font-mono text-[#6B7784] ml-3 uppercase">
                            ({entry.task.attribute.name})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        {entry.focusVerified && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30 uppercase">
                            Server-Verified
                          </span>
                        )}
                        <span className="text-[#C5A059] font-semibold">
                          +{entry.xpAwarded} MOMENTUM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
