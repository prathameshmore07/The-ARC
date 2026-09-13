'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/shell/AppShell';
import { inferQuestArchetype } from '@/lib/game-engine';
import { CheckCircle2, Filter, Sparkles, Award } from 'lucide-react';

type Completion = {
  id: string;
  xpAwarded: number;
  gritAwarded: number;
  focusVerified: boolean;
  completedAt: string;
  milestoneUnlocked?: boolean;
  badgeUnlocked?: boolean;
  task: {
    title: string;
    attribute: {
      name: string;
    };
  };
};

type DashboardData = {
  completions: Completion[];
  user: any;
  attributes: any[];
};

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'TODAY';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'YESTERDAY';
  } else {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getAttributeColor(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('body')) return 'text-[#8F1D1D] border-[#8F1D1D]/30 bg-[#8F1D1D]/10';
  if (lowerName.includes('mind')) return 'text-blue-500 border-blue-500/30 bg-blue-500/10';
  if (lowerName.includes('craft')) return 'text-[#C5A059] border-[#C5A059]/30 bg-[#C5A059]/10';
  if (lowerName.includes('people')) return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
  return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
}

export default function HistoryPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const attributes = ['ALL', 'BODY', 'MIND', 'CRAFT', 'PEOPLE'];

  let filteredCompletions = data?.completions || [];
  if (filter !== 'ALL') {
    filteredCompletions = filteredCompletions.filter(c => c.task.attribute.name.toUpperCase() === filter);
  }

  // Group by date
  const groupedCompletions: Record<string, Completion[]> = {};
  filteredCompletions.forEach(c => {
    const header = formatDateHeader(c.completedAt);
    if (!groupedCompletions[header]) {
      groupedCompletions[header] = [];
    }
    groupedCompletions[header].push(c);
  });

  return (
    <AppShell>
      <div className="min-h-screen bg-[#06090E] text-[#F2EEE6] p-6 font-mono selection:bg-[#C5A059] selection:text-[#06090E]">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-[#F2EEE6]">LIVING LEDGER</h1>
            <p className="text-[#C5A059] tracking-widest uppercase text-sm">THE SOVEREIGN CHRONICLE</p>
          </header>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center" role="tablist">
            <Filter className="w-5 h-5 text-[#D4B57A]" />
            {attributes.map(attr => (
              <button
                key={attr}
                role="tab"
                onClick={() => setFilter(attr)}
                className={`px-4 py-2 border transition-colors focus:outline-none focus:ring-2 focus:ring-[#C5A059] ${
                  filter === attr 
                    ? 'border-[#C5A059] bg-[#C5A059]/10 text-[#D4B57A]' 
                    : 'border-[#1C2333] text-[#8B949E] hover:border-[#30363D] hover:text-[#F2EEE6]'
                }`}
                aria-selected={filter === attr}
              >
                {attr}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-8 animate-pulse" aria-label="Loading ledger...">
              {[1, 2].map(group => (
                <div key={group} className="space-y-4">
                  <div className="h-6 w-32 bg-[#1C2333]"></div>
                  <div className="h-[1px] w-full bg-[#C5A059]/20"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map(item => (
                      <div key={item} className="h-24 w-full bg-[#1C2333] border border-[#1C2333]"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCompletions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center border border-[#1C2333] bg-[#0A0F16]">
              <div className="w-16 h-16 border border-[#1C2333] flex items-center justify-center transform rotate-45">
                <CheckCircle2 className="w-8 h-8 text-[#1C2333] transform -rotate-45" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tight text-[#F2EEE6]">NO MOVES INSCRIBED YET</h2>
                <p className="text-[#8B949E]">Your chronicle awaits its first entry.</p>
              </div>
              <Link 
                href="/quests" 
                className="mt-4 px-6 py-3 border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#06090E] transition-colors font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#06090E] focus:ring-[#C5A059]"
              >
                EMBARK ON QUEST
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(groupedCompletions).map(([dateHeader, comps]) => (
                <section key={dateHeader} className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-bold text-[#C5A059] tracking-widest">{dateHeader}</h2>
                    <div className="flex-1 h-[1px] bg-[#C5A059]/20"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {comps.map(completion => {
                      const archetype = inferQuestArchetype ? inferQuestArchetype(completion.task.title) : 'ACTION';
                      
                      return (
                        <div 
                          key={completion.id} 
                          className={`group flex flex-col md:flex-row md:items-center justify-between p-6 bg-[#0A0F16] border transition-colors duration-300 ${completion.milestoneUnlocked || completion.badgeUnlocked ? 'border-[#C5A059]/50 shadow-[0_0_15px_rgba(197,160,89,0.1)]' : 'border-[#1C2333] hover:border-[#C5A059]'}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="mt-1">
                              <CheckCircle2 className="w-6 h-6 text-[#C5A059]" aria-hidden="true" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-black uppercase tracking-tight text-[#F2EEE6] group-hover:text-[#D4B57A] transition-colors">{completion.task.title}</h3>
                              
                              <div className="flex flex-wrap items-center gap-3 text-xs tracking-wider font-bold">
                                <span className={`px-2 py-1 border uppercase ${getAttributeColor(completion.task.attribute.name)}`}>
                                  {completion.task.attribute.name}
                                </span>
                                <span className="px-2 py-1 border border-[#8B949E]/30 text-[#8B949E] bg-[#8B949E]/10 uppercase">
                                  {archetype}
                                </span>
                                <span className="text-[#8B949E] flex items-center">
                                  +{completion.xpAwarded} XP · +{completion.gritAwarded} MARKS
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2 md:pl-6">
                            <span className="text-sm text-[#8B949E]">{formatTime(completion.completedAt)}</span>
                            
                            {(completion.milestoneUnlocked || completion.badgeUnlocked) && (
                              <div className="flex items-center space-x-2 text-[#C5A059] text-xs font-bold tracking-wider">
                                {completion.milestoneUnlocked && (
                                  <span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> MILESTONE</span>
                                )}
                                {completion.badgeUnlocked && (
                                  <span className="flex items-center"><Award className="w-3 h-3 mr-1" /> BADGE UNLOCKED</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
