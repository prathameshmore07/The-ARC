'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLevelTitle, getShadowOriginStory } from '@/lib/game-engine';

interface ShadowData {
  id: string;
  hp: number;
  baselineWeeklyRate: number;
  stealRate: number;
  sealProgress: number;
  stepsNeeded: number;
  stolenXpPool?: number;
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

interface LivingLedgerProps {
  attributes: AttributeData[];
  tasks: TaskData[];
  onCompleteTask: (taskId: string, focusSessionId?: string) => Promise<void>;
  onStartFocus: (task: { id: string; title: string }) => void;
  onAddTask: (title: string, attributeId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onRenameAttribute: (attributeId: string, newName: string) => Promise<void>;
}

export default function LivingLedger({
  attributes,
  tasks,
  onCompleteTask,
  onStartFocus,
  onAddTask,
  onDeleteTask,
  onRenameAttribute,
}: LivingLedgerProps) {
  const [expandedAttrId, setExpandedAttrId] = useState<string | null>(attributes[0]?.id || null);
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [scribing, setScribing] = useState(false);

  const handleSaveRename = async (attrId: string) => {
    if (!editName.trim()) {
      setEditingAttrId(null);
      return;
    }
    await onRenameAttribute(attrId, editName.trim());
    setEditingAttrId(null);
  };

  const handleScribeQuest = async (e: React.FormEvent, attributeId: string) => {
    e.preventDefault();
    if (!newQuestTitle.trim() || scribing) return;
    try {
      setScribing(true);
      await onAddTask(newQuestTitle.trim(), attributeId);
      setNewQuestTitle('');
    } finally {
      setScribing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#E7E1D3] tracking-tight">
            The Living Ledger
          </h2>
          <p className="text-xs text-[#9AA5B8] mt-0.5">
            Your recorded life areas. Consistent action keeps entries clean; neglect lets the ink stain bleed.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {attributes.map((attr) => {
          const isExpanded = expandedAttrId === attr.id;
          const attrTasks = tasks.filter((t) => t.attributeId === attr.id);
          const pendingTasks = attrTasks.filter((t) => t.status !== 'done');
          const doneTasks = attrTasks.filter((t) => t.status === 'done');
          const shadow = attr.shadow;
          const hasShadow = !!shadow;
          const isDecaying = attr.decayStatus === 'decaying';
          const hasResolveBoost = attr.xpBoostUntil && new Date(attr.xpBoostUntil) > new Date();

          // Calculate overdue days for display
          const msSinceActivity = Date.now() - new Date(attr.lastActivityAt).getTime();
          const daysNeglected = Math.max(1, Math.floor(msSinceActivity / (1000 * 60 * 60 * 24)));

          const originStory = shadow
            ? getShadowOriginStory(shadow.baselineWeeklyRate || 0, daysNeglected)
            : null;

          return (
            <div
              key={attr.id}
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                hasShadow ? 'stained-shadow bg-[#25202B]' : 'parchment-shadow bg-[#E7E1D3]'
              }`}
            >
              {/* Deckle bottom paper tear edge effect */}
              <div
                className={`p-6 sm:p-7 ledger-deckle-edge transition-colors duration-500 ${
                  hasShadow ? 'bg-[#2A2532] text-[#E7E1D3]' : 'bg-[#E7E1D3] text-[#23324A]'
                }`}
              >
                {/* Ink Stain Bleed Visual (v4 Part B) */}
                {hasShadow && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <svg
                      className="absolute -right-12 -top-12 w-[120%] h-[120%] opacity-25 mix-blend-multiply"
                      viewBox="0 0 200 200"
                      preserveAspectRatio="none"
                    >
                      <path
                        fill="#1C1824"
                        d="M38.1,-63.9C49.9,-58.5,60.4,-49.2,67.8,-37.8C75.2,-26.4,79.5,-13.2,79.8,0.2C80.1,13.6,76.5,27.1,68.9,38.2C61.3,49.2,49.8,57.7,37.3,64.2C24.7,70.7,11.2,75.2,-2.1,78.8C-15.4,82.4,-29.8,85.2,-41.8,79.6C-53.7,74.1,-63.2,60.2,-71.2,46.1C-79.3,31.9,-85.9,16,-84.9,0.6C-83.9,-14.8,-75.3,-29.6,-65.4,-41.7C-55.5,-53.8,-44.3,-63.1,-31.8,-68C-19.3,-72.9,-5.5,-73.4,6.4,-84.4L38.1,-63.9Z"
                        transform="translate(100 100)"
                      />
                    </svg>
                  </div>
                )}

                {/* Entry Header */}
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-[#23324A]/15">
                    <div className="flex items-center gap-3">
                      {editingAttrId === attr.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(attr.id)}
                            className="text-xl font-serif font-bold px-2 py-1 rounded bg-[#DDD6C6] text-[#23324A] border border-[#A87C3F] focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(attr.id)}
                            className="text-xs px-2.5 py-1 bg-[#A87C3F] text-white rounded font-serif font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-serif font-bold text-2xl tracking-tight">
                            {attr.name}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingAttrId(attr.id);
                              setEditName(attr.name);
                            }}
                            className="text-xs opacity-40 hover:opacity-100 transition-opacity p-1"
                            title="Rename life area"
                          >
                            ✎
                          </button>
                        </div>
                      )}

                      {/* Rank Stamp */}
                      <span className="text-xs font-serif font-semibold px-2.5 py-0.5 rounded-full border border-[#A87C3F]/40 text-[#A87C3F] bg-[#A87C3F]/10">
                        {getLevelTitle(attr.level)}
                      </span>

                      {/* Resolve Boost Badge */}
                      {hasResolveBoost && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#6B8F71] text-white">
                          ✦ Post-Battle Resolve (+10% XP)
                        </span>
                      )}
                    </div>

                    {/* Ledger Stamps: Level & Streak */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 font-serif font-bold text-[#A87C3F]">
                        <span>Level</span>
                        <span className="text-lg font-mono">{attr.level}</span>
                      </div>
                      <div className="h-4 w-px bg-[#23324A]/20" />
                      <div className="flex items-center gap-1">
                        <span className="text-[#A87C3F]">🔥</span>
                        <span className="font-mono font-bold">{attr.streak}d Streak</span>
                      </div>
                      <button
                        onClick={() => setExpandedAttrId(isExpanded ? null : attr.id)}
                        className="ml-2 text-xs font-serif font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
                      >
                        {isExpanded ? 'Fold Entry ▲' : `Inspect (${pendingTasks.length} quests) ▼`}
                      </button>
                    </div>
                  </div>

                  {/* XP Progress Rule */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#DDD6C6] rounded-full overflow-hidden border border-[#23324A]/10">
                      <div
                        className={`h-full transition-all duration-700 ${
                          hasShadow ? 'bg-[#8B3A3A]' : 'bg-[#A87C3F]'
                        }`}
                        style={{ width: `${Math.round(attr.progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-mono text-[#4E5E7A] whitespace-nowrap">
                      {attr.xp} XP / {attr.xpForNextLevel} XP
                    </span>
                  </div>

                  {/* Shadow Stain Card Banner (v4 Part A #2 & #6) */}
                  {hasShadow && shadow && (
                    <div className="mt-4 p-4 rounded-lg bg-[#1E1B22]/90 border border-[#8B3A3A]/40 text-[#E7E1D3]">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🌑</span>
                          <h4 className="font-serif font-bold text-sm tracking-wide text-[#E7E1D3]">
                            Living Shadow · HP {shadow.hp}
                          </h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#8B3A3A]/40 text-[#FFAEAE] border border-[#8B3A3A]/60">
                            Taxes 20% of new XP
                          </span>
                        </div>

                        {/* Banishing Seal Progress */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#A87C3F] font-serif font-semibold">Banishing Seal:</span>
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: shadow.stepsNeeded }).map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                                  idx < shadow.sealProgress
                                    ? 'bg-[#6B8F71] border-[#8BAF91] shadow-[0_0_8px_rgba(107,143,113,0.8)]'
                                    : 'bg-[#2A2532] border-[#4E5E7A]/50'
                                }`}
                                title={`Seal step ${idx + 1}/${shadow.stepsNeeded}`}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[#A87C3F] text-xs ml-1">
                            {shadow.sealProgress}/{shadow.stepsNeeded}
                          </span>
                        </div>
                      </div>

                      {/* Memory Origin Story Caption (v4 Part A #2) */}
                      <p className="text-xs text-[#DDD6C6]/90 italic font-serif leading-relaxed">
                        "{originStory}"
                      </p>
                    </div>
                  )}

                  {/* Expanded Quest Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-6 pt-4 border-t border-[#23324A]/15 overflow-hidden"
                      >
                        {/* Scribe New Quest Input */}
                        <form
                          onSubmit={(e) => handleScribeQuest(e, attr.id)}
                          className="flex gap-2 mb-4"
                        >
                          <input
                            type="text"
                            value={newQuestTitle}
                            onChange={(e) => setNewQuestTitle(e.target.value)}
                            placeholder={`Scribe a new quest for ${attr.name}...`}
                            className={`flex-1 px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#A87C3F] transition-colors ${
                              hasShadow
                                ? 'bg-[#1E1B22] border-[#4E5E7A]/40 text-[#E7E1D3] placeholder-[#9AA5B8]'
                                : 'bg-[#DDD6C6] border-[#23324A]/20 text-[#23324A] placeholder-[#4E5E7A]'
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={!newQuestTitle.trim() || scribing}
                            className="px-4 py-2 bg-[#A87C3F] hover:bg-[#926B34] disabled:opacity-50 text-white font-serif font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-sm"
                          >
                            {scribing ? 'Inking...' : '+ Scribe Quest'}
                          </button>
                        </form>

                        {/* Active Quests */}
                        <div className="space-y-2.5">
                          {pendingTasks.length === 0 ? (
                            <p className="text-xs italic text-[#4E5E7A] py-3 text-center">
                              No active quests recorded. Scribe one above to make progress.
                            </p>
                          ) : (
                            pendingTasks.map((task) => (
                              <div
                                key={task.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border transition-all ${
                                  hasShadow
                                    ? 'bg-[#1E1B22]/80 border-[#4E5E7A]/40 text-[#E7E1D3]'
                                    : 'bg-[#F2ECE1] border-[#23324A]/15 text-[#23324A]'
                                }`}
                              >
                                <span className="font-medium text-sm mb-2 sm:mb-0">
                                  {task.title}
                                </span>

                                <div className="flex items-center gap-2">
                                  {/* Quick checkbox complete */}
                                  <button
                                    onClick={() => onCompleteTask(task.id)}
                                    className="px-3 py-1 text-xs rounded border border-[#A87C3F]/40 hover:bg-[#A87C3F]/20 text-[#A87C3F] font-semibold transition-colors"
                                    title="Quick check: awards base XP, does not advance banish seal"
                                  >
                                    ✓ Check Off
                                  </button>

                                  {/* Proof-of-Grind Server-Timed Session (v4 Part A #4) */}
                                  <button
                                    onClick={() => onStartFocus({ id: task.id, title: task.title })}
                                    className="px-3 py-1 text-xs rounded bg-[#A87C3F] hover:bg-[#926B34] text-white font-serif font-bold transition-all shadow-sm flex items-center gap-1"
                                    title="Server-timed focus session: advances banish seal & banks bonus XP"
                                  >
                                    <span>⏳</span>
                                    <span>Timed Session</span>
                                  </button>

                                  <button
                                    onClick={() => onDeleteTask(task.id)}
                                    className="text-xs text-[#8B3A3A] hover:text-red-400 p-1 ml-1"
                                    title="Erase quest"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))
                          )}

                          {/* Completed Quests Log */}
                          {doneTasks.length > 0 && (
                            <div className="pt-3 border-t border-[#23324A]/10">
                              <span className="text-[10px] uppercase font-serif font-bold tracking-wider text-[#4E5E7A]">
                                Inked Entries ({doneTasks.length})
                              </span>
                              <div className="mt-1 space-y-1">
                                {doneTasks.slice(0, 3).map((done) => (
                                  <div
                                    key={done.id}
                                    className="text-xs line-through text-[#4E5E7A] flex items-center gap-2"
                                  >
                                    <span>✓</span>
                                    <span>{done.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
