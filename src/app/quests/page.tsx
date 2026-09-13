'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/shell/AppShell';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  Filter,
  Sparkles,
  X,
  Plus,
  Edit3,
  Trash2,
  Flame,
  Coins,
  Check,
} from 'lucide-react';
import {
  ArcAttributeKey,
  ARC_ATTRIBUTES,
  QuestDifficulty,
  QUEST_DIFFICULTIES,
  calculateQuestReward,
  QuestArchetype,
  QuestTargetType,
  QUEST_ARCHETYPES,
  DEFAULT_STARTER_QUESTS,
  StarterQuest,
} from '@/lib/game-engine';
import ArcCelebrationModal, { CelebrationPayload } from '@/components/game/ArcCelebrationModal';
import NetworkErrorBanner from '@/components/game/NetworkErrorBanner';
import EmptyState from '@/components/game/EmptyState';

export type Quest = StarterQuest;

interface CelebrationData {
  questTitle: string;
  attrKey: ArcAttributeKey;
  attrPoints: number;
  momentum: number;
  marks: number;
  xp: number;
  streak: number;
  leveledUp?: boolean;
}

const ATTRIBUTE_IMAGES: Record<ArcAttributeKey, string> = {
  BODY: '/images/arc/arc-body.jpg',
  MIND: '/images/arc/arc-mind.jpg',
  CRAFT: '/images/arc/arc-craft.jpg',
  PEOPLE: '/images/arc/arc-people.jpg',
};

const DEFAULT_QUESTS: Quest[] = DEFAULT_STARTER_QUESTS;

export default function QuestsPage() {
  const router = useRouter();
  const [activeAttr, setActiveAttr] = useState<ArcAttributeKey | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODAY' | 'RECOMMENDED'>('ALL');
  const [activeArchetype, setActiveArchetype] = useState<QuestArchetype | 'ALL'>('ALL');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [quests, setQuests] = useState<Quest[]>(DEFAULT_QUESTS);
  const [completedQuestId, setCompletedQuestId] = useState<string | null>(null);
  const [celebrationData, setCelebrationData] = useState<CelebrationPayload | null>(null);
  const [networkError, setNetworkError] = useState<{ quest: Quest; message: string } | null>(null);
  const [attributes, setAttributes] = useState<any[]>([]);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editQuest, setEditQuest] = useState<Quest | null>(null);

  // Create Form State - Multi-Archetype
  const [formArchetype, setFormArchetype] = useState<QuestArchetype>('FOCUS');
  const [formTitle, setFormTitle] = useState('');
  const [formTarget, setFormTarget] = useState('45 MIN');
  const [formAttr, setFormAttr] = useState<ArcAttributeKey>('CRAFT');
  const [formDiff, setFormDiff] = useState<QuestDifficulty>('II');
  const [formDuration, setFormDuration] = useState(45);
  const [formObjective, setFormObjective] = useState('');
  const [formWhy, setFormWhy] = useState('');

  // Dynamic Archetype Fields
  const [formDistance, setFormDistance] = useState(3.0);
  const [formDistanceUnit, setFormDistanceUnit] = useState('KM');
  const [formCount, setFormCount] = useState(20);
  const [formCountUnit, setFormCountUnit] = useState('Pages');
  const [formCheckpoints, setFormCheckpoints] = useState<string[]>([
    'Define schema & interface contracts',
    'Implement core algorithmic logic',
    'Run automated verification & ship artifact',
  ]);
  const [newFormCheckpoint, setNewFormCheckpoint] = useState('');
  const [formActionPrompt, setFormActionPrompt] = useState('Who did you connect with and what truth was shared?');
  const [formSkillSets, setFormSkillSets] = useState(5);
  const [formSkillTarget, setFormSkillTarget] = useState('Record working sets, weights, reps, and technique observations.');

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editDiff, setEditDiff] = useState<QuestDifficulty>('II');
  const [editObjective, setEditObjective] = useState('');

  // Reward preview for create form
  const previewReward = useMemo(() => {
    return calculateQuestReward(formDiff);
  }, [formDiff]);

  // Load existing tasks from dashboard
  const loadServerTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAttributes(data.attributes || []);
        if (data.tasks && data.tasks.length > 0) {
          const userQuests: Quest[] = data.tasks
            .filter((t: any) => t.status !== 'done')
            .map((t: any, idx: number) => {
              const attrName = (t.attribute?.name || 'CRAFT').toUpperCase();
              let attrKey: ArcAttributeKey = 'CRAFT';
              if (attrName.includes('BODY') || attrName.includes('STRENGTH')) attrKey = 'BODY';
              else if (attrName.includes('MIND') || attrName.includes('INTELLECT')) attrKey = 'MIND';
              else if (attrName.includes('PEOPLE') || attrName.includes('SOCIAL')) attrKey = 'PEOPLE';

              const titleUpper = t.title.toUpperCase();
              let taskArchetype: QuestArchetype = 'FOCUS';
              let targetText = '30 MIN';
              let targetVal = 30;
              let unit = 'MIN';

              if (titleUpper.includes('RUN') || titleUpper.includes('WALK') || titleUpper.includes('KM') || titleUpper.includes('DISTANCE')) {
                taskArchetype = 'DISTANCE';
                targetText = '3.0 KM';
                targetVal = 3.0;
                unit = 'KM';
              } else if (titleUpper.includes('READ') || titleUpper.includes('PAGE') || titleUpper.includes('COUNT') || titleUpper.includes('REP')) {
                taskArchetype = 'COUNT';
                targetText = '20 PAGES';
                targetVal = 20;
                unit = 'Pages';
              } else if (titleUpper.includes('BUILD') || titleUpper.includes('SHIP') || titleUpper.includes('DEPLOY') || titleUpper.includes('FEATURE')) {
                taskArchetype = 'BUILD';
                targetText = '3 CHECKPOINTS';
                targetVal = 3;
                unit = 'Checkpoints';
              } else if (titleUpper.includes('CALL') || titleUpper.includes('PRESENCE') || titleUpper.includes('REACH') || titleUpper.includes('CONNECT')) {
                taskArchetype = 'ACTION';
                targetText = 'CONFIRMATION';
                targetVal = 1;
                unit = 'Call';
              } else if (titleUpper.includes('LIFT') || titleUpper.includes('WORKOUT') || titleUpper.includes('PRACTICE') || titleUpper.includes('SKILL')) {
                taskArchetype = 'SKILL';
                targetText = '5 SETS LOGGED';
                targetVal = 5;
                unit = 'Sets';
              }

              const diff = (idx % 2 === 0 ? 'II' : 'I') as QuestDifficulty;
              const rew = calculateQuestReward(diff);

              return {
                id: t.id,
                code: String(idx + 1).padStart(3, '0'),
                title: t.title.toUpperCase(),
                archetype: taskArchetype,
                targetType: QUEST_ARCHETYPES[taskArchetype].targetType,
                target: targetText,
                targetValue: targetVal,
                unit,
                durationMinutes: 30,
                attribute: attrKey,
                tags: `${attrKey} · ${taskArchetype}`,
                difficulty: diff,
                objective: `Fulfill the daily self-directed move: "${t.title}".`,
                whyItMatters: 'Self-directed daily action creates unbreakable momentum.',
                attributeReward: rew.attr,
                momentumReward: rew.momentum,
                marksReward: rew.marks,
                xpReward: rew.xp,
                category: 'TODAY',
                isCustom: true,
              };
            });

          setQuests((prev) => {
            const defaultFiltered = prev.filter((q) => !q.isCustom);
            return [...userQuests, ...defaultFiltered];
          });
        }
      }
    } catch (e) {
      console.error('Failed to load server tasks', e);
    }
  }, []);

  useEffect(() => {
    loadServerTasks();
  }, [loadServerTasks]);

  // Filtered Quests by Attribute and Archetype
  const filteredQuests = quests.filter((q) => {
    const matchesAttr = activeAttr === 'ALL' || q.attribute === activeAttr;
    const matchesArchetype = activeArchetype === 'ALL' || q.archetype === activeArchetype;
    const matchesTab =
      activeTab === 'ALL' ||
      (activeTab === 'TODAY'
        ? q.category === 'TODAY'
        : q.category === 'RECOMMENDED' || q.category === 'TODAY');
    return matchesAttr && matchesArchetype && matchesTab;
  });

  // Handle Quest Creation with Dynamic Archetype Inputs
  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const rew = calculateQuestReward(formDiff);
    const newQuestId = `custom-${Date.now()}`;
    const newCode = String(quests.length + 1).padStart(3, '0');

    let computedTarget = formTarget.trim() || '45 MIN';
    let computedTargetValue = formDuration;
    let computedUnit = 'MIN';

    if (formArchetype === 'FOCUS') {
      computedTarget = `${formDuration} MIN`;
      computedTargetValue = formDuration;
      computedUnit = 'MIN';
    } else if (formArchetype === 'DISTANCE') {
      computedTarget = `${formDistance.toFixed(1)} ${formDistanceUnit}`;
      computedTargetValue = formDistance;
      computedUnit = formDistanceUnit;
    } else if (formArchetype === 'COUNT') {
      computedTarget = `${formCount} ${formCountUnit.toUpperCase()}`;
      computedTargetValue = formCount;
      computedUnit = formCountUnit;
    } else if (formArchetype === 'BUILD') {
      computedTarget = `${formCheckpoints.length} CHECKPOINTS`;
      computedTargetValue = formCheckpoints.length;
      computedUnit = 'Checkpoints';
    } else if (formArchetype === 'ACTION') {
      computedTarget = 'CONFIRMATION';
      computedTargetValue = 1;
      computedUnit = 'Call';
    } else if (formArchetype === 'SKILL') {
      computedTarget = `${formSkillSets} SETS LOGGED`;
      computedTargetValue = formSkillSets;
      computedUnit = 'Sets';
    }

    const createdQuest: Quest = {
      id: newQuestId,
      code: newCode,
      title: formTitle.trim().toUpperCase(),
      archetype: formArchetype,
      targetType: QUEST_ARCHETYPES[formArchetype].targetType,
      target: computedTarget,
      targetValue: computedTargetValue,
      unit: computedUnit,
      durationMinutes: formDuration,
      attribute: formAttr,
      tags: `${formAttr} · ${formArchetype}`,
      difficulty: formDiff,
      objective:
        formObjective.trim() ||
        `Complete dedicated ${formArchetype.toLowerCase()} ritual: ${formTitle.trim()}.`,
      whyItMatters: formWhy.trim() || 'Intentional real-world action advances your sovereign journey.',
      attributeReward: rew.attr,
      momentumReward: rew.momentum,
      marksReward: rew.marks,
      xpReward: rew.xp,
      category: 'TODAY',
      checkpoints: formArchetype === 'BUILD' ? formCheckpoints : undefined,
      actionPrompt: formArchetype === 'ACTION' ? formActionPrompt : undefined,
      skillPrompt: formArchetype === 'SKILL' ? formSkillTarget : undefined,
      isCustom: true,
    };

    setQuests((prev) => [createdQuest, ...prev]);

    try {
      const targetAttrObj =
        attributes.find((a: any) => a.name.toUpperCase().includes(formAttr)) || attributes[0];
      if (targetAttrObj) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            attributeId: targetAttrObj.id,
          }),
        });
      }
    } catch (err) {
      console.error('Offline task creation fallback', err);
    }

    setFormTitle('');
    setFormObjective('');
    setFormWhy('');
    setCreateModalOpen(false);
  };

  // Handle Quest Update
  const handleOpenEdit = (quest: Quest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditQuest(quest);
    setEditTitle(quest.title);
    setEditTarget(quest.target);
    setEditDiff(quest.difficulty);
    setEditObjective(quest.objective);
  };

  const handleUpdateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editQuest || !editTitle.trim()) return;

    const rew = calculateQuestReward(editDiff);

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === editQuest.id) {
          return {
            ...q,
            title: editTitle.trim().toUpperCase(),
            target: editTarget.trim(),
            difficulty: editDiff,
            objective: editObjective.trim(),
            attributeReward: rew.attr,
            momentumReward: rew.momentum,
            marksReward: rew.marks,
            xpReward: rew.xp,
          };
        }
        return q;
      })
    );

    if (!editQuest.id.startsWith('quest-') && !editQuest.id.startsWith('custom-')) {
      try {
        await fetch(`/api/tasks/${editQuest.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle.trim() }),
        });
      } catch (err) {
        console.error('Failed to patch task on server', err);
      }
    }

    setEditQuest(null);
    if (selectedQuest?.id === editQuest.id) {
      setSelectedQuest(null);
    }
  };

  // Handle Quest Deletion
  const handleDeleteQuest = async (questId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setQuests((prev) => prev.filter((q) => q.id !== questId));
    if (selectedQuest?.id === questId) {
      setSelectedQuest(null);
    }

    if (!questId.startsWith('quest-') && !questId.startsWith('custom-')) {
      try {
        await fetch(`/api/tasks/${questId}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete task on server', err);
      }
    }
  };

  // Handle Quest Completion
  const handleCompleteQuest = async (quest: Quest, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCompletedQuestId(quest.id);
    setNetworkError(null);

    const rew = calculateQuestReward(quest.difficulty);
    const marksEarned = quest.marksReward || rew.marks;
    const xpEarned = quest.xpReward || rew.xp;
    const momentumEarned = quest.momentumReward || rew.momentum;
    const attrPointsEarned = quest.attributeReward || rew.attr;

    try {
      let finalAttr = attrPointsEarned;
      let finalMomentum = momentumEarned;
      let finalMarks = marksEarned;
      let finalXp = xpEarned;
      let streak = 8;
      let leveledUp = false;
      let newLevelTitle: string | undefined = undefined;

      if (!quest.id.startsWith('quest-') && !quest.id.startsWith('custom-')) {
        const res = await fetch(`/api/tasks/${quest.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            archetype: quest.archetype,
            durationMinutes: quest.durationMinutes,
            elapsedDurationSec: quest.durationMinutes * 60,
            distanceValue: quest.targetValue || 3.0,
            countValue: quest.targetValue || 20,
            completedCheckpoints: quest.checkpoints || ['Checkpoint 1', 'Checkpoint 2', 'Checkpoint 3'],
            requiredCheckpoints: quest.checkpoints?.length || 1,
            confirmed: true,
            skillOutput: quest.skillPrompt || 'Practice output deliberated',
          }),
        });
        if (!res.ok) {
          throw new Error('Quest completion rejected by server authority.');
        }
        const json = await res.json();
        finalAttr = json.attributeGained || attrPointsEarned;
        finalMomentum = json.momentumAwarded || momentumEarned;
        finalMarks = json.marksAwarded || marksEarned;
        finalXp = json.xpAwarded || xpEarned;
        streak = json.newStreak || 8;
        leveledUp = json.leveledUp || false;
        newLevelTitle = json.newLevelTitle;

        window.dispatchEvent(
          new CustomEvent('arc-state-update', {
            detail: {
              marks: json.newGrit,
              streak: json.newStreak,
            },
          })
        );
      } else {
        window.dispatchEvent(
          new CustomEvent('arc-state-update', {
            detail: {
              marks: 184 + marksEarned,
              streak: 8,
            },
          })
        );
      }

      setCelebrationData({
        questTitle: quest.title,
        attrKey: quest.attribute,
        attrPoints: finalAttr,
        momentum: finalMomentum,
        marks: finalMarks,
        xp: finalXp,
        streak,
        leveledUp,
        oldLevel: 7,
        newLevel: 8,
        oldTitle: 'BUILDER',
        newTitle: newLevelTitle || 'MOMENTUM',
      });

      setQuests((prev) => prev.filter((q) => q.id !== quest.id));
      if (selectedQuest?.id === quest.id) {
        setSelectedQuest(null);
      }
    } catch (err: any) {
      console.error('Error completing quest', err);
      setNetworkError({
        quest,
        message: 'Your progress was not lost. The server could not reconcile this quest.',
      });
    } finally {
      setCompletedQuestId(null);
    }
  };

  return (
    <AppShell>
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-24">
        {/* Header with Forge New Quest CTA */}
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <span className="font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold block mb-2">
              MISSION BOARD · REAL LIFE RPG
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl text-[#F2EEE6] tracking-tight uppercase mb-3">
              Real Actions.<br />Real Progress.
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#8B97A6] font-light max-w-xl leading-relaxed">
              Every quest is a tangible real-world move. Choose what you intend to improve, accept the challenge, and record your forward momentum.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-sans text-xs tracking-[0.2em] uppercase font-semibold transition-all rounded shadow-[0_4px_24px_rgba(197,160,89,0.3)] shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Forge New Quest</span>
          </button>
        </header>

        {/* ─────────────────────────────────────────────────────────────
            01. HORIZONTAL CINEMATIC ATTRIBUTE STRIP
        ───────────────────────────────────────────────────────────── */}
        <section className="mb-10" aria-label="Attribute Mission Board">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(ARC_ATTRIBUTES) as ArcAttributeKey[]).map((key) => {
              const cfg = ARC_ATTRIBUTES[key];
              const isSelected = activeAttr === key;
              const count = quests.filter((q) => q.attribute === key).length;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveAttr(activeAttr === key ? 'ALL' : key)}
                  className={`group relative h-36 rounded-lg overflow-hidden border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30 shadow-[0_8px_30px_rgba(197,160,89,0.2)]'
                      : 'border-[#1E2938] hover:border-[#3A4E65]'
                  }`}
                >
                  <Image
                    src={ATTRIBUTE_IMAGES[key]}
                    alt={cfg.label}
                    fill
                    className={`object-cover transition-transform duration-700 group-hover:scale-105 ${
                      isSelected ? 'opacity-90' : 'opacity-40 grayscale-[30%] group-hover:opacity-75'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080C12] via-[#080C12]/60 to-transparent" />

                  <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between">
                    <div>
                      <span className="font-display font-semibold text-lg text-[#F2EEE6] group-hover:text-[#C5A059] transition-colors uppercase tracking-wide block">
                        {cfg.label}
                      </span>
                      <span className="font-mono text-[9px] tracking-widest text-[#8B97A6] uppercase">
                        {count} AVAILABLE
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            02. FILTER TABS (ALL · TODAY · RECOMMENDED)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1A222C]">
          <div className="flex items-center gap-2">
            {[
              { id: 'ALL', label: 'All Quests' },
              { id: 'TODAY', label: 'Today' },
              { id: 'RECOMMENDED', label: 'Recommended' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors rounded cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#121B26] text-[#C5A059] border border-[#C5A059]/40 font-semibold'
                    : 'text-[#6B7784] hover:text-[#EDE8DF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="font-mono text-[10px] text-[#6B7784] uppercase tracking-widest">
            {filteredQuests.length} QUESTS AVAILABLE
          </span>
        </div>

        {/* Archetype Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <span className="text-[10px] font-mono text-[#6B7784] uppercase tracking-widest mr-2 shrink-0">
            Archetype:
          </span>
          <button
            type="button"
            onClick={() => setActiveArchetype('ALL')}
            className={`px-3 py-1 text-[10px] font-mono tracking-wider uppercase rounded transition-colors shrink-0 cursor-pointer ${
              activeArchetype === 'ALL'
                ? 'bg-[#1E2938] text-[#EDE8DF] font-bold border border-[#38485C]'
                : 'text-[#6B7784] hover:text-[#EDE8DF] border border-transparent'
            }`}
          >
            All Archetypes
          </button>
          {(Object.keys(QUEST_ARCHETYPES) as QuestArchetype[]).map((arch) => {
            const cfg = QUEST_ARCHETYPES[arch];
            const isSelected = activeArchetype === arch;
            return (
              <button
                key={arch}
                type="button"
                onClick={() => setActiveArchetype(activeArchetype === arch ? 'ALL' : arch)}
                className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase rounded transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? `${cfg.badgeStyle} ring-1 ring-current font-bold`
                    : 'border-[#1A232E] text-[#6B7784] hover:text-[#EDE8DF]'
                }`}
              >
                {cfg.tag}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            03. QUEST ROWS (LARGE TYPOGRAPHY & FULL CRUD CONTROLS)
        ───────────────────────────────────────────────────────────── */}
        {filteredQuests.length === 0 ? (
          <EmptyState
            type="quests"
            onAction={() => setCreateModalOpen(true)}
            actionText="Forge New Quest →"
          />
        ) : (
          <div className="divide-y divide-[#151E2A] border-y border-[#151E2A]">
            {filteredQuests.map((quest) => {
              const isCompleted = completedQuestId === quest.id;
              const archConfig = QUEST_ARCHETYPES[quest.archetype] || QUEST_ARCHETYPES.FOCUS;

              return (
                <div
                  key={quest.id}
                  onClick={() => setSelectedQuest(quest)}
                  className={`group relative py-5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-[#0D141F] cursor-pointer ${
                    isCompleted ? 'opacity-40' : ''
                  }`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-transparent group-hover:bg-[#C5A059] transition-colors" />

                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    {/* Quest Code & Attribute */}
                    <div className="shrink-0 text-left">
                      <span className="font-mono text-xs text-[#4A5565] group-hover:text-[#C5A059] font-semibold block transition-colors">
                        {quest.code}
                      </span>
                      <span className="font-mono text-[9px] text-[#7E8B99] uppercase">
                        {quest.attribute}
                      </span>
                    </div>

                    {/* Attribute thumbnail */}
                    <div className="relative w-11 h-11 rounded overflow-hidden border border-[#1E2938] shrink-0 hidden sm:block">
                      <Image
                        src={ATTRIBUTE_IMAGES[quest.attribute]}
                        alt={quest.attribute}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Title & Info */}
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#F2EEE6] group-hover:text-[#C5A059] transition-colors tracking-wide uppercase">
                          {quest.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider border ${archConfig.badgeStyle}`}>
                          {archConfig.tag}
                        </span>
                        <span className="font-mono text-xs text-[#C5A059]">
                          {quest.target}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#151E2A] text-[#8B97A6] font-mono text-[9px] uppercase">
                          TIER {quest.difficulty}
                        </span>
                      </div>

                      <p className="font-sans text-xs text-[#8B97A6] font-light mt-1 max-w-xl line-clamp-1 sm:line-clamp-none">
                        {quest.objective}
                      </p>
                    </div>
                  </div>

                  {/* Right Rewards & CRUD Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#141C26]">
                    {/* Reward Pills */}
                    <div className="font-mono text-xs text-right hidden md:block">
                      <span className="text-[#EDE8DF]">+{quest.attributeReward} {quest.attribute}</span>
                      <span className="mx-2 text-[#38485C]">·</span>
                      <span className="text-[#C5A059]">+{quest.marksReward || 10} MARKS</span>
                    </div>

                    {/* Action Icons: Edit, Delete, Complete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(quest, e)}
                        className="p-2 text-[#6B7784] hover:text-[#C5A059] hover:bg-[#151E2A] rounded transition-colors cursor-pointer"
                        title="Edit Quest"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteQuest(quest.id, e)}
                        className="p-2 text-[#6B7784] hover:text-[#C0392B] hover:bg-[#151E2A] rounded transition-colors cursor-pointer"
                        title="Archive Quest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleCompleteQuest(quest, e)}
                        className="p-2 text-[#6B7784] hover:text-[#3A7F58] hover:bg-[#151E2A] rounded transition-colors cursor-pointer"
                        title="Mark Complete & Claim Rewards"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Accept / Begin Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const params = new URLSearchParams({
                          attr: quest.attribute,
                          archetype: quest.archetype,
                          duration: String(quest.durationMinutes),
                          title: quest.title,
                          targetValue: String(quest.targetValue || ''),
                          unit: quest.unit || '',
                        });
                        router.push(`/focus/${quest.id}?${params.toString()}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-[10px] font-sans tracking-[0.18em] uppercase font-semibold transition-all rounded shadow-[0_2px_12px_rgba(197,160,89,0.25)] cursor-pointer"
                    >
                      <span>Begin &rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          04. SPLIT-SCREEN QUEST DETAIL MODAL (ARTWORK ON LEFT, INFO ON RIGHT)
      ───────────────────────────────────────────────────────────── */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-3xl w-full bg-[#0C1016] border border-[#243040] shadow-[0_30px_90px_rgba(0,0,0,0.95)] rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Left: Atmospheric Artwork Panel */}
            <div className="md:col-span-5 relative min-h-[240px] md:min-h-[460px] border-b md:border-b-0 md:border-r border-[#1E2938]">
              <Image
                src={ATTRIBUTE_IMAGES[selectedQuest.attribute]}
                alt={selectedQuest.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0C1016] via-transparent to-transparent" />
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#080C12]/80 backdrop-blur-sm border border-[#1E2938] font-mono text-[10px] text-[#C5A059] uppercase tracking-wider">
                {selectedQuest.tags}
              </div>
            </div>

            {/* Right: Quest Dossier Information */}
            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#1A222C] mb-4">
                  <span className="font-mono text-xs text-[#8B97A6] tracking-wider">
                    QUEST {selectedQuest.code} · {selectedQuest.target}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuest(null)}
                    className="text-[#6B7784] hover:text-[#F2EEE6] transition-colors p-1 cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="font-display font-semibold text-3xl text-[#F2EEE6] uppercase tracking-wide mb-4">
                  {selectedQuest.title}
                </h2>

                <div className="space-y-4 text-xs font-sans text-[#8B97A6] mb-6">
                  <div>
                    <span className="block font-mono text-[9px] text-[#6B7784] tracking-widest uppercase mb-1">
                      OBJECTIVE
                    </span>
                    <p className="text-sm text-[#EDE8DF] font-light leading-relaxed">
                      {selectedQuest.objective}
                    </p>
                  </div>

                  <div>
                    <span className="block font-mono text-[9px] text-[#C5A059] tracking-widest uppercase mb-1">
                      WHY IT MATTERS
                    </span>
                    <p className="italic text-[#8B97A6] leading-relaxed">
                      &ldquo;{selectedQuest.whyItMatters}&rdquo;
                    </p>
                  </div>

                  <div className="p-4 rounded border border-[#1A2534] bg-[#080C12]">
                    <span className="block font-mono text-[9px] text-[#6B7784] tracking-widest uppercase mb-2">
                      REWARD ON COMPLETION
                    </span>
                    <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
                      <span className="text-[#EDE8DF]">+{selectedQuest.attributeReward} {selectedQuest.attribute}</span>
                      <span className="text-[#38485C]">·</span>
                      <span className="text-[#C5A059]">+{selectedQuest.momentumReward} MOMENTUM</span>
                      <span className="text-[#38485C]">·</span>
                      <span className="text-[#EDE8DF]">+{selectedQuest.marksReward || 10} MARKS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#141C26]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(selectedQuest, e)}
                    className="px-3 py-2 text-[11px] font-sans tracking-wider uppercase text-[#8B97A6] hover:text-[#C5A059] transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCompleteQuest(selectedQuest, e)}
                    className="px-3 py-2 text-[11px] font-sans tracking-wider uppercase text-[#3A7F58] hover:text-[#4AA872] transition-colors cursor-pointer"
                  >
                    Complete
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedQuest(null)}
                    className="px-4 py-2.5 text-[11px] font-sans tracking-[0.16em] uppercase text-[#7E8B99] hover:text-[#EDE8DF] transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({
                        attr: selectedQuest.attribute,
                        archetype: selectedQuest.archetype,
                        duration: String(selectedQuest.durationMinutes),
                        title: selectedQuest.title,
                        targetValue: String(selectedQuest.targetValue || ''),
                        unit: selectedQuest.unit || '',
                      });
                      router.push(`/focus/${selectedQuest.id}?${params.toString()}`);
                    }}
                    className="px-6 py-2.5 text-[11px] font-sans tracking-[0.18em] uppercase text-[#080C12] bg-[#C5A059] hover:bg-[#D4B57A] transition-colors font-semibold shadow-[0_4px_20px_rgba(197,160,89,0.3)] cursor-pointer"
                  >
                    Begin Quest &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          05. FORGE NEW QUEST MODAL (LIVE REWARD PREVIEW MATRIX)
      ───────────────────────────────────────────────────────────── */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative max-w-lg w-full bg-[#0C1016] border border-[#243040] shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 sm:p-8 rounded-lg my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A222C] mb-5">
              <div>
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#C5A059] uppercase block mb-0.5">
                  MISSION FORGE
                </span>
                <span className="font-display text-base tracking-[0.15em] uppercase text-[#F2EEE6] font-semibold">
                  Forge Real-World Quest
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[#6B7784] hover:text-[#F2EEE6] transition-colors p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuest} className="space-y-4">
              {/* Quest Title */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                  Quest Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5K Morning Run or Deep Crafting Block"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-[#080C12] border border-[#1E2938] px-4 py-2.5 text-sm text-[#F2EEE6] placeholder-[#4A5565] focus:outline-none focus:border-[#C5A059] transition-colors font-sans rounded"
                />
              </div>

              {/* Archetype Selector */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                  Execution Archetype
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(Object.keys(QUEST_ARCHETYPES) as QuestArchetype[]).map((arch) => {
                    const cfg = QUEST_ARCHETYPES[arch];
                    const isSelected = formArchetype === arch;
                    return (
                      <button
                        key={arch}
                        type="button"
                        onClick={() => {
                          setFormArchetype(arch);
                          if (arch === 'DISTANCE') setFormAttr('BODY');
                          else if (arch === 'COUNT') setFormAttr('MIND');
                          else if (arch === 'BUILD') setFormAttr('CRAFT');
                          else if (arch === 'ACTION') setFormAttr('PEOPLE');
                          else if (arch === 'SKILL') setFormAttr('BODY');
                          else setFormAttr('CRAFT');
                        }}
                        className={`py-2 px-1 text-center font-mono rounded border transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.badgeStyle} ring-1 ring-current font-bold`
                            : 'border-[#1E2938] text-[#6B7784] hover:text-[#EDE8DF]'
                        }`}
                      >
                        <span className="block text-[10px]">{cfg.tag}</span>
                        <span className="block text-[8px] uppercase opacity-75 mt-0.5">
                          {cfg.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Dynamic Inputs by Archetype ──────────────────────── */}
              {formArchetype === 'FOCUS' && (
                <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#B89CF7] uppercase tracking-wider">
                      [ FOCUS ] Session Duration
                    </span>
                    <span className="font-mono text-xs text-[#EDE8DF] font-bold">
                      {formDuration} Minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={120}
                    step={5}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full accent-[#8A63D2] cursor-pointer"
                  />
                  <p className="text-[10px] text-[#8B97A6] font-light">
                    Unbroken immersion timer. Strict timer integrity enforced.
                  </p>
                </div>
              )}

              {formArchetype === 'DISTANCE' && (
                <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12] space-y-3">
                  <span className="font-mono text-[10px] text-[#38BDF8] uppercase tracking-wider block">
                    [ DISTANCE ] Physical Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                        Target Distance
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={formDistance}
                        onChange={(e) => setFormDistance(parseFloat(e.target.value) || 1.0)}
                        className="w-full bg-[#121B26] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-mono rounded focus:border-[#38BDF8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                        Distance Unit
                      </label>
                      <div className="grid grid-cols-2 gap-1 font-mono text-xs">
                        {(['KM', 'Miles'] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setFormDistanceUnit(u)}
                            className={`py-1.5 rounded border transition-colors cursor-pointer ${
                              formDistanceUnit === u
                                ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#38BDF8]'
                                : 'border-[#1E2938] text-[#6B7784]'
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formArchetype === 'COUNT' && (
                <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12] space-y-3">
                  <span className="font-mono text-[10px] text-[#34D399] uppercase tracking-wider block">
                    [ COUNT ] Tactile Volume
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                        Target Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formCount}
                        onChange={(e) => setFormCount(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-[#121B26] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-mono rounded focus:border-[#34D399]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                        Item / Unit Label
                      </label>
                      <input
                        type="text"
                        value={formCountUnit}
                        onChange={(e) => setFormCountUnit(e.target.value)}
                        placeholder="Pages, Reps, Units..."
                        className="w-full bg-[#121B26] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-sans rounded focus:border-[#34D399]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formArchetype === 'BUILD' && (
                <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12] space-y-3">
                  <span className="font-mono text-[10px] text-[#FBBF24] uppercase tracking-wider block">
                    [ BUILD ] Outcome Checkpoints
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {formCheckpoints.map((cp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-[#121B26] border border-[#1E2938] text-xs text-[#EDE8DF]"
                      >
                        <span className="truncate pr-2">{cp}</span>
                        {formCheckpoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormCheckpoints((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="text-[#6B7784] hover:text-[#E74C3C] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFormCheckpoint}
                      onChange={(e) => setNewFormCheckpoint(e.target.value)}
                      placeholder="Add milestone checkpoint..."
                      className="flex-1 bg-[#121B26] border border-[#1E2938] px-3 py-1.5 text-xs text-[#EDE8DF] rounded focus:border-[#FBBF24]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newFormCheckpoint.trim()) return;
                        setFormCheckpoints((prev) => [...prev, newFormCheckpoint.trim()]);
                        setNewFormCheckpoint('');
                      }}
                      className="px-3 py-1.5 bg-[#1E2938] hover:bg-[#2A3B4F] text-[#FBBF24] text-xs font-mono uppercase rounded cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              )}

              {formArchetype === 'ACTION' && (
                <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12] space-y-2">
                  <span className="font-mono text-[10px] text-[#F472B6] uppercase tracking-wider block">
                    [ ACTION ] Reflection Question
                  </span>
                  <input
                    type="text"
                    value={formActionPrompt}
                    onChange={(e) => setFormActionPrompt(e.target.value)}
                    placeholder="e.g. Who did you connect with and what was shared?"
                    className="w-full bg-[#121B26] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] rounded focus:border-[#F472B6]"
                  />
                  <p className="text-[10px] text-[#8B97A6] font-light">
                    Real-world action requires intentional hold-to-confirm reflection.
                  </p>
                </div>
              )}

              {formArchetype === 'SKILL' && (
                <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12] space-y-3">
                  <span className="font-mono text-[10px] text-[#C5A059] uppercase tracking-wider block">
                    [ SKILL ] Deliberate Practice Target
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                        Practice Drill
                      </label>
                      <input
                        type="text"
                        value={formSkillTarget}
                        onChange={(e) => setFormSkillTarget(e.target.value)}
                        placeholder="e.g. Compound Lifts or Scale Drills"
                        className="w-full bg-[#121B26] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] rounded focus:border-[#C5A059]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                        Working Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={formSkillSets}
                        onChange={(e) => setFormSkillSets(parseInt(e.target.value, 10) || 3)}
                        className="w-full bg-[#121B26] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-mono rounded focus:border-[#C5A059]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Area & Difficulty Tier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                    Growth Area
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                    {(['BODY', 'MIND', 'CRAFT', 'PEOPLE'] as ArcAttributeKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setFormAttr(k)}
                        className={`py-1.5 px-2 text-center text-[11px] uppercase border rounded transition-all cursor-pointer ${
                          formAttr === k
                            ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#F2EEE6]'
                            : 'border-[#1E2938] text-[#8B97A6] hover:border-[#33445C]'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                    Difficulty Tier
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['I', 'II', 'III', 'IV', 'V'] as QuestDifficulty[]).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setFormDiff(diff)}
                        className={`py-1.5 text-center text-[11px] font-mono uppercase border rounded transition-all cursor-pointer ${
                          formDiff === diff
                            ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059] font-bold'
                            : 'border-[#1E2938] text-[#6B7784] hover:border-[#33445C]'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Reward Preview Matrix */}
              <div className="p-3.5 rounded border border-[#1E2938] bg-[#080C12]/90">
                <span className="block text-[9px] font-mono tracking-widest text-[#C5A059] uppercase font-semibold mb-2">
                  Calculated Server Reward Matrix
                </span>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2 rounded bg-[#0D141F] border border-[#182332]">
                    <span className="block text-[8px] text-[#6B7784] uppercase">XP</span>
                    <span className="text-xs text-[#EDE8DF] font-semibold">+{previewReward.xp}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0D141F] border border-[#182332]">
                    <span className="block text-[8px] text-[#6B7784] uppercase">MOMENTUM</span>
                    <span className="text-xs text-[#C5A059] font-semibold">+{previewReward.momentum}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0D141F] border border-[#182332]">
                    <span className="block text-[8px] text-[#6B7784] uppercase">MARKS</span>
                    <span className="text-xs text-[#EDE8DF] font-semibold">+{previewReward.marks}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0D141F] border border-[#182332]">
                    <span className="block text-[8px] text-[#6B7784] uppercase">{formAttr}</span>
                    <span className="text-xs text-[#3A7F58] font-semibold">+{previewReward.attr}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#141B24]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-5 py-2.5 text-[11px] font-sans tracking-[0.16em] uppercase text-[#7E8B99] hover:text-[#EDE8DF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-[11px] font-sans tracking-[0.18em] uppercase text-[#080C12] bg-[#C5A059] hover:bg-[#D4B57A] transition-colors font-semibold shadow-[0_2px_12px_rgba(197,160,89,0.25)] cursor-pointer rounded"
                >
                  Forge Quest &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          06. EDIT QUEST MODAL
      ───────────────────────────────────────────────────────────── */}
      {editQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative max-w-md w-full bg-[#0C1016] border border-[#243040] shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 sm:p-8 rounded-lg">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A222C] mb-6">
              <span className="font-display text-sm tracking-[0.18em] uppercase text-[#F2EEE6] font-semibold">
                Edit Quest Dossier
              </span>
              <button
                type="button"
                onClick={() => setEditQuest(null)}
                className="text-[#6B7784] hover:text-[#F2EEE6] transition-colors p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateQuest} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                  Quest Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#080C12] border border-[#1E2938] px-4 py-2.5 text-sm text-[#F2EEE6] focus:outline-none focus:border-[#C5A059] transition-colors font-sans rounded"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                  Target
                </label>
                <input
                  type="text"
                  required
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full bg-[#080C12] border border-[#1E2938] px-4 py-2.5 text-sm text-[#F2EEE6] focus:outline-none focus:border-[#C5A059] transition-colors font-sans rounded"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                  Difficulty Tier
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['I', 'II', 'III', 'IV', 'V'] as QuestDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setEditDiff(diff)}
                      className={`py-2 text-center text-xs font-mono uppercase border rounded transition-all cursor-pointer ${
                        editDiff === diff
                          ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059] font-bold'
                          : 'border-[#1E2938] text-[#6B7784] hover:border-[#33445C]'
                      }`}
                    >
                      TIER {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase mb-1.5">
                  Objective
                </label>
                <textarea
                  rows={3}
                  value={editObjective}
                  onChange={(e) => setEditObjective(e.target.value)}
                  className="w-full bg-[#080C12] border border-[#1E2938] px-4 py-2 text-xs text-[#F2EEE6] focus:outline-none focus:border-[#C5A059] transition-colors font-sans rounded"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-[#141B24]">
                <button
                  type="button"
                  onClick={() => setEditQuest(null)}
                  className="px-5 py-2.5 text-[11px] font-sans tracking-[0.16em] uppercase text-[#7E8B99] hover:text-[#EDE8DF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-[11px] font-sans tracking-[0.18em] uppercase text-[#080C12] bg-[#C5A059] hover:bg-[#D4B57A] transition-colors font-semibold shadow-[0_2px_12px_rgba(197,160,89,0.25)] cursor-pointer rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          07. CELEBRATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {celebrationData && (
        <ArcCelebrationModal
          data={celebrationData}
          onClose={() => setCelebrationData(null)}
          onViewJourney={() => router.push('/journey')}
        />
      )}

      {networkError && (
        <NetworkErrorBanner
          message={networkError.message}
          onRetry={() => {
            const q = networkError.quest;
            setNetworkError(null);
            handleCompleteQuest(q);
          }}
          onDismiss={() => setNetworkError(null)}
        />
      )}
    </AppShell>
  );
}
