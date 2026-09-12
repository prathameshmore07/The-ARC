'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, Play, Skull, Sparkles, Coins, Zap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import LevelUpOverlay, { LevelUpData } from '@/components/LevelUpOverlay';
import LedgerToast, { LedgerToastData } from '@/components/LedgerToast';

interface Quest {
  id: string;
  title: string;
  status: string;
  attributeId: string;
  attribute: { id: string; name: string };
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface AttributeDetail {
  id: string;
  name: string;
  level: number;
  xp: number;
  progress: number;
  xpForNextLevel: number;
  shadow?: {
    id: string;
    hp: number;
    sealProgress: number;
    stepsNeeded: number;
  } | null;
}

export default function QuestBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: attributeId } = use(params);

  const [attribute, setAttribute] = useState<AttributeDetail | null>(null);
  const [allAttributes, setAllAttributes] = useState<Array<{ id: string; name: string }>>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [floatingReward, setFloatingReward] = useState<{ id: string; xp: number; gold: number } | null>(null);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [questTitle, setQuestTitle] = useState('');
  const [selectedAttrId, setSelectedAttrId] = useState(attributeId);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [creatingQuest, setCreatingQuest] = useState(false);

  // Global overlays
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [ledgerToast, setLedgerToast] = useState<LedgerToastData | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        const found = json.attributes?.find((a: any) => a.id === attributeId);
        if (found) {
          setAttribute(found);
        }
        setAllAttributes(json.attributes?.map((a: any) => ({ id: a.id, name: a.name })) || []);
        setQuests(json.tasks?.filter((t: any) => t.attributeId === attributeId) || []);
      }
    } finally {
      setLoading(false);
    }
  }, [attributeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quest Creation (Radix Dialog)
  const handleForgeQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questTitle.trim() || creatingQuest) return;

    try {
      setCreatingQuest(true);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: questTitle.trim(),
          attributeId: selectedAttrId,
        }),
      });

      if (res.ok) {
        setQuestTitle('');
        setIsDialogOpen(false);
        await loadData();
      }
    } finally {
      setCreatingQuest(false);
    }
  };

  // Handle Quest Click / Complete with tactile float animation
  const handleBeginQuest = async (quest: Quest) => {
    if (quest.difficulty === 'medium' || quest.difficulty === 'hard') {
      router.push(`/focus/${quest.id}`);
      return;
    }

    setCompletingTaskId(quest.id);
    const rewardXp = 25;
    const rewardGold = 10;
    setFloatingReward({ id: quest.id, xp: rewardXp, gold: rewardGold });

    try {
      const res = await fetch(`/api/tasks/${quest.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();

        setLedgerToast({
          earned: result.earned,
          stolen: result.stolen,
          secured: result.secured,
          reclaimed: result.reclaimed,
          shadowDefeated: result.shadowDefeated,
          attributeName: attribute?.name || 'Quest',
        });

        if (result.leveledUp) {
          setLevelUpData({
            attributeName: result.attributeName,
            newLevel: result.newLevel,
          });
        }
      }

      await loadData();
    } finally {
      setTimeout(() => {
        setCompletingTaskId(null);
      }, 700);
      setTimeout(() => {
        setFloatingReward(null);
      }, 1200);
    }
  };

  const getRewardAmount = (diff: 'easy' | 'medium' | 'hard') => {
    if (diff === 'hard') return 120;
    if (diff === 'medium') return 60;
    return 25;
  };

  if (loading || !attribute) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-6">
        <div className="max-w-3xl mx-auto space-y-4 pt-12">
          <div className="h-8 bg-[var(--bg-surface-1)] rounded w-32 animate-pulse" />
          <div className="h-48 bg-[var(--bg-surface-1)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const isShadowed = !!attribute.shadow;
  const pendingQuests = quests.filter((q) => q.status !== 'done');
  const doneQuests = quests.filter((q) => q.status === 'done');

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col pb-24 md:pb-12">
      <Navigation />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text-headline)] transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Dashboard</span>
        </Link>

        {/* Quest Board Hero Card */}
        <div className="bg-[var(--bg-surface-1)] p-6 sm:p-8 rounded-2xl shadow-rpg-md border border-[var(--border-subtle)] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-[var(--accent-amber)] block mb-1">
                Discipline Board
              </span>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[var(--text-headline)] tracking-tight">
                {attribute.name}
              </h1>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-serif font-bold text-xl text-[var(--accent-amber)] block">
                Level {attribute.level}
              </span>
              <span className="text-xs text-[var(--text-dim)]">
                {attribute.xp} / {attribute.xpForNextLevel} XP
              </span>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="h-3 bg-[#1F2937] rounded-full overflow-hidden border border-[var(--border-subtle)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-slate)] to-[var(--accent-amber)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(attribute.progress * 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Shadow Alert (if active) */}
          {isShadowed && attribute.shadow && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-400" aria-hidden="true" />
                <span className="text-xs font-serif font-bold">
                  Shadow Active (HP {attribute.shadow.hp}) · Steals 20% of gained XP
                </span>
              </div>
              <Link
                href={`/attribute/${attribute.id}/confront`}
                className="text-xs font-serif font-bold px-3 py-1 rounded bg-[var(--accent-brick)] hover:bg-red-700 text-white transition-colors"
              >
                Confront
              </Link>
            </div>
          )}
        </div>

        {/* Quest List Action Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-xl text-[var(--text-headline)]">
            Active Quests
          </h2>

          <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-slate)] hover:bg-slate-500 text-white font-serif font-bold text-xs transition-colors shadow-rpg-sm cursor-pointer">
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Forge a Quest</span>
              </button>
            </Dialog.Trigger>

            {/* Radix Dialog Shell for Creating Quest */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--bg-surface-1)] p-8 rounded-2xl shadow-rpg-md border border-[var(--border-subtle)] text-[var(--text-body)]">
                <Dialog.Title className="font-serif font-bold text-2xl text-[var(--text-headline)] mb-1">
                  Forge a Quest
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--text-dim)] mb-6">
                  Set a concrete real-world action to bank progress and counter entropy.
                </Dialog.Description>

                <form onSubmit={handleForgeQuest} className="space-y-4">
                  <div>
                    <label htmlFor="quest-title" className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
                      What needs to be accomplished?
                    </label>
                    <input
                      id="quest-title"
                      type="text"
                      required
                      placeholder="e.g. Implement parser module or run 5km"
                      value={questTitle}
                      onChange={(e) => setQuestTitle(e.target.value)}
                      className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-headline)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-amber)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
                      Discipline
                    </label>
                    <select
                      value={selectedAttrId}
                      onChange={(e) => setSelectedAttrId(e.target.value)}
                      className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-headline)] focus:outline-none"
                    >
                      {allAttributes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
                      Difficulty & Scope
                    </label>
                    <RadioGroup.Root
                      value={difficulty}
                      onValueChange={(val) => setDifficulty(val as any)}
                      className="grid grid-cols-3 gap-2"
                    >
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <RadioGroup.Item
                          key={diff}
                          value={diff}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all text-center cursor-pointer ${
                            difficulty === diff
                              ? 'bg-[var(--accent-slate)] text-white border-[var(--accent-slate)] shadow-sm'
                              : 'bg-[var(--bg-surface-2)] text-[var(--text-dim)] border-[var(--border-subtle)] hover:border-[var(--border-hover)]'
                          }`}
                        >
                          {diff}
                        </RadioGroup.Item>
                      ))}
                    </RadioGroup.Root>
                  </div>

                  {/* Live Reward Preview */}
                  <div className="p-3 bg-[var(--bg-surface-2)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <span className="text-[var(--text-dim)]">Reward Guarantee:</span>
                    <span className="font-serif font-bold text-[var(--accent-amber)] text-sm">
                      +{getRewardAmount(difficulty)} XP · +10 Gold
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-xs text-[var(--text-faint)] hover:text-[var(--text-body)]"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>

                    <button
                      type="submit"
                      disabled={!questTitle.trim() || creatingQuest}
                      className="px-5 py-2.5 bg-[var(--accent-amber)] hover:bg-amber-300 text-[var(--bg-base)] font-serif font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                    >
                      {creatingQuest ? 'Forging...' : 'Forge Quest'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Quest List */}
        <div className="space-y-3">
          {pendingQuests.length === 0 ? (
            <div className="p-8 text-center bg-[var(--bg-surface-1)] rounded-2xl border border-[var(--border-subtle)] text-sm text-[var(--text-dim)]">
              No open quests recorded for {attribute.name}. Forge one above to begin banking progress.
            </div>
          ) : (
            pendingQuests.map((quest) => {
              const isCompleting = completingTaskId === quest.id;
              const hasFloat = floatingReward && floatingReward.id === quest.id;

              return (
                <div
                  key={quest.id}
                  className="relative flex items-center justify-between p-4 sm:p-5 rounded-xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] shadow-rpg-sm transition-all"
                >
                  {/* Floating +XP and +Gold popup at point of action */}
                  {hasFloat && (
                    <div className="absolute right-12 top-0 pointer-events-none z-30 animate-float-up flex items-center gap-2">
                      <span className="text-xs font-bold font-serif text-[var(--accent-amber)] bg-black/80 px-2 py-0.5 rounded shadow">
                        +{floatingReward.xp} XP
                      </span>
                      <span className="text-xs font-bold text-amber-200 bg-black/80 px-2 py-0.5 rounded shadow">
                        +{floatingReward.gold} Gold
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-sm text-[var(--text-headline)] mb-1">
                      {quest.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-[var(--accent-amber)] font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        +25 XP
                      </span>
                      <span className="text-amber-200/80 font-medium flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        +10 Gold
                      </span>
                      <span className="text-[var(--text-faint)]">· Daily Objective</span>
                    </div>
                  </div>

                  {/* Tactile Complete Button */}
                  <button
                    onClick={() => handleBeginQuest(quest)}
                    disabled={isCompleting}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-serif font-bold text-xs transition-all cursor-pointer ${
                      isCompleting
                        ? 'bg-[var(--accent-forest)] text-white scale-95 shadow-rpg-glow'
                        : 'bg-[var(--accent-slate)] hover:bg-slate-500 text-white active:scale-95 shadow-rpg-sm'
                    }`}
                  >
                    {isCompleting ? (
                      <>
                        <Check className="w-3.5 h-3.5 animate-in zoom-in" aria-hidden="true" />
                        <span>Reclaimed</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>Complete</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}

          {/* Archived Done Quests */}
          {doneQuests.length > 0 && (
            <div className="pt-6 border-t border-[var(--border-subtle)]">
              <span className="text-xs uppercase font-serif tracking-wider text-[var(--text-faint)] block mb-3">
                Completed Quests ({doneQuests.length})
              </span>
              <div className="space-y-2">
                {doneQuests.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--bg-surface-1)]/40 text-[var(--text-faint)] text-xs line-through border border-[var(--border-subtle)]/40"
                  >
                    <Check className="w-3.5 h-3.5 text-[var(--accent-forest)]" aria-hidden="true" />
                    <span>{q.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global Overlays */}
      <LedgerToast toast={ledgerToast} onDismiss={() => setLedgerToast(null)} />
      <LevelUpOverlay levelUp={levelUpData} onDismiss={() => setLevelUpData(null)} />
    </div>
  );
}
