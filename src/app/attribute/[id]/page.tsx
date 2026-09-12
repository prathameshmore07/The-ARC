'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, Play, Skull, ChevronDown } from 'lucide-react';
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

  // Handle Quest Click / Complete (Section 3.7)
  const handleBeginQuest = async (quest: Quest) => {
    // If medium or hard, routes to Focus Mode (Section 3.9)
    if (quest.difficulty === 'medium' || quest.difficulty === 'hard') {
      router.push(`/focus/${quest.id}`);
      return;
    }

    // Instant Complete (Easy): button compression -> checkmark morph -> three-number toast -> XP bar animation
    setCompletingTaskId(quest.id);

    try {
      const res = await fetch(`/api/tasks/${quest.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();

        // 3. Small toast rises showing the three-number split (Section 3.7)
        setLedgerToast({
          earned: result.earned,
          stolen: result.stolen,
          secured: result.secured,
          reclaimed: result.reclaimed,
          shadowDefeated: result.shadowDefeated,
          attributeName: attribute?.name || 'Quest',
        });

        // 4. If crosses level threshold, hand off to Level-Up overlay (Section 3.10)
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
      }, 600);
    }
  };

  const getRewardAmount = (diff: 'easy' | 'medium' | 'hard') => {
    if (diff === 'hard') return 120;
    if (diff === 'medium') return 60;
    return 25;
  };

  if (loading || !attribute) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] p-6">
        <div className="max-w-3xl mx-auto space-y-4 pt-12">
          <div className="h-8 bg-[var(--page-bone)]/10 rounded w-32 animate-pulse" />
          <div className="h-48 bg-[var(--page-bone)]/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const isShadowed = !!attribute.shadow;
  const pendingQuests = quests.filter((q) => q.status !== 'done');
  const doneQuests = quests.filter((q) => q.status === 'done');

  return (
    <div className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex flex-col pb-24 md:pb-12">
      <Navigation />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--page-bone-dim)] hover:text-[var(--page-bone)] transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Ledger</span>
        </Link>

        {/* Quest Board Header (Section 3.6) */}
        <div className="bg-[var(--page-bone)] text-[var(--fresh-ink)] p-8 rounded-2xl parchment-shadow border border-[var(--line)] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div>
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-[var(--brass)] block mb-1">
                Quest Board
              </span>
              <h1 className="font-serif font-bold text-4xl sm:text-5xl tracking-tight">
                {attribute.name}
              </h1>
            </div>

            <div className="text-right">
              <span className="font-serif font-bold text-2xl text-[var(--fresh-ink)] block">
                Level {attribute.level}
              </span>
              <span className="text-xs text-[var(--fresh-ink)]/70">
                {attribute.xp} / {attribute.xpForNextLevel} XP
              </span>
            </div>
          </div>

          {/* XP Bar (Intensity 5/10 animation) */}
          <div className="mt-4">
            <div className="h-2.5 bg-[var(--page-bone-dim)] rounded-full overflow-hidden border border-[var(--line)]">
              <motion.div
                className="h-full bg-[var(--brass)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(attribute.progress * 100)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Shadow Alert (if active) */}
          {isShadowed && attribute.shadow && (
            <div className="mt-5 p-3 rounded-xl bg-[var(--stain)] text-[var(--page-bone)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-red-400" aria-hidden="true" />
                <span className="text-xs font-serif font-bold">
                  Shadow Active (HP {attribute.shadow.hp}) · Taxes 20% of gained XP
                </span>
              </div>
              <Link
                href={`/attribute/${attribute.id}/confront`}
                className="text-xs font-serif font-bold text-[var(--brass)] hover:underline"
              >
                Confront
              </Link>
            </div>
          )}
        </div>

        {/* Quest List Action Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif font-bold text-xl text-[var(--page-bone)]">
            Available Quests
          </h2>

          <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger asChild>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-xs transition-colors shadow-sm cursor-pointer">
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Forge a Quest</span>
              </button>
            </Dialog.Trigger>

            {/* Radix Dialog Shell for Creating Quest */}
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--ink-navy)]/80 backdrop-blur-sm" />
              <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--page-bone)] p-8 rounded-2xl parchment-shadow border border-[var(--line)] text-[var(--fresh-ink)]">
                <Dialog.Title className="font-serif font-bold text-2xl text-[var(--fresh-ink)] mb-1">
                  Forge a Quest
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--fresh-ink)]/70 mb-6">
                  Set a concrete real-world action to bank progress and weaken the void.
                </Dialog.Description>

                <form onSubmit={handleForgeQuest} className="space-y-4">
                  <div>
                    <label htmlFor="quest-title" className="block text-xs font-semibold mb-1.5">
                      What needs to be done?
                    </label>
                    <input
                      id="quest-title"
                      type="text"
                      required
                      placeholder="e.g. Read 20 pages of technical paper"
                      value={questTitle}
                      onChange={(e) => setQuestTitle(e.target.value)}
                      className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-2.5 text-sm text-[var(--fresh-ink)] placeholder-[var(--fresh-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ink-navy)]"
                    />
                  </div>

                  {/* Attribute Select (Radix Select) */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Attribute
                    </label>
                    <select
                      value={selectedAttrId}
                      onChange={(e) => setSelectedAttrId(e.target.value)}
                      className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-2.5 text-sm text-[var(--fresh-ink)] focus:outline-none"
                    >
                      {allAttributes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty RadioGroup (Styled as 3 Quiet Pill Buttons) */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Difficulty
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
                              ? 'bg-[var(--brass)] text-[var(--ink-navy)] border-[var(--brass)] shadow-sm'
                              : 'bg-[var(--page-bone-dim)]/40 text-[var(--fresh-ink)] border-[var(--line)] hover:border-[var(--brass)]/50'
                          }`}
                        >
                          {diff}
                        </RadioGroup.Item>
                      ))}
                    </RadioGroup.Root>
                  </div>

                  {/* Live Reward Preview */}
                  <div className="p-3 bg-[var(--page-bone-dim)]/40 rounded-xl border border-[var(--line)] flex items-center justify-between text-xs">
                    <span className="text-[var(--fresh-ink)]/70">Reward Preview:</span>
                    <span className="font-serif font-bold text-[var(--brass)] text-sm">
                      +{getRewardAmount(difficulty)} XP
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-xs text-[var(--fresh-ink)]/70 hover:text-[var(--fresh-ink)]"
                      >
                        Cancel
                      </button>
                    </Dialog.Close>

                    <button
                      type="submit"
                      disabled={!questTitle.trim() || creatingQuest}
                      className="px-5 py-2.5 bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-xs rounded-xl shadow-sm disabled:opacity-50"
                    >
                      {creatingQuest ? 'Forging...' : 'Forge Quest'}
                    </button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        {/* Quest List (Section 3.6 & 3.7) */}
        <div className="space-y-3">
          {pendingQuests.length === 0 ? (
            <div className="p-8 text-center bg-[var(--page-bone)]/5 rounded-2xl border border-[var(--page-bone-dim)]/15 text-sm text-[var(--page-bone-dim)]">
              No open quests for {attribute.name}. Forge one above to begin banking progress.
            </div>
          ) : (
            pendingQuests.map((quest) => {
              const isCompleting = completingTaskId === quest.id;
              return (
                <div
                  key={quest.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-[var(--page-bone)] text-[var(--fresh-ink)] parchment-shadow border border-[var(--line)] transition-all"
                >
                  <div>
                    <h3 className="font-medium text-sm text-[var(--fresh-ink)]">{quest.title}</h3>
                    <span className="text-[11px] text-[var(--brass)] font-semibold mt-0.5 block">
                      +25 XP
                    </span>
                  </div>

                  {/* Begin Quest Button (Not a checkbox!) */}
                  <button
                    onClick={() => handleBeginQuest(quest)}
                    disabled={isCompleting}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-serif font-bold text-xs transition-all cursor-pointer ${
                      isCompleting
                        ? 'bg-[var(--reclaim)] text-white scale-95'
                        : 'bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] active:scale-95 shadow-sm'
                    }`}
                  >
                    {isCompleting ? (
                      <>
                        <Check className="w-3.5 h-3.5 animate-in zoom-in" aria-hidden="true" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>Begin Quest</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}

          {/* Inked Done Quests */}
          {doneQuests.length > 0 && (
            <div className="pt-6 border-t border-[var(--page-bone-dim)]/10">
              <span className="text-xs uppercase font-serif tracking-wider text-[var(--page-bone-dim)]/60 block mb-3">
                Archived Quests ({doneQuests.length})
              </span>
              <div className="space-y-2">
                {doneQuests.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--page-bone)]/5 text-[var(--page-bone-dim)]/60 text-xs line-through border border-white/5"
                  >
                    <Check className="w-3.5 h-3.5 text-[var(--reclaim)]" aria-hidden="true" />
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
