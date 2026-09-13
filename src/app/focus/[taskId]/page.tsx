'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Pause,
  Play,
  X,
  Minus,
  AlertTriangle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  ArcAttributeKey,
  QuestArchetype,
  QUEST_ARCHETYPES,
  DEFAULT_STARTER_QUESTS,
  validateQuestCompletion,
  inferQuestArchetype,
} from '@/lib/game-engine';
import ComicReactionEngine, { ComicReactionPayload } from '@/components/game/ComicReactionEngine';

interface SkillSet {
  id: string;
  setNumber: number;
  exercise: string;
  reps: string;
  weight: string;
  completed: boolean;
}

export default function FocusQuestPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { taskId } = use(params);

  // Parse Query Parameters
  const paramArchetype = (searchParams.get('archetype')?.toUpperCase() || null) as QuestArchetype | null;
  const paramAttr = (searchParams.get('attr')?.toUpperCase() || null) as ArcAttributeKey | null;
  const paramTitle = searchParams.get('title');
  const paramDuration = searchParams.get('duration') ? parseInt(searchParams.get('duration')!, 10) : null;
  const paramTargetValue = searchParams.get('targetValue') ? parseFloat(searchParams.get('targetValue')!) : null;
  const paramUnit = searchParams.get('unit');

  // Match Starter Quest Preset
  const starter = DEFAULT_STARTER_QUESTS.find((q) => q.id === taskId);

  // Inferred Archetype
  let inferredArchetype: QuestArchetype = 'FOCUS';
  if (paramArchetype && QUEST_ARCHETYPES[paramArchetype]) {
    inferredArchetype = paramArchetype;
  } else if (starter) {
    inferredArchetype = starter.archetype;
  } else if (paramTitle) {
    inferredArchetype = inferQuestArchetype(paramTitle);
  } else if (taskId.includes('run') || taskId.includes('dist') || taskId === 'quest-002' || taskId === 'quest-055') {
    inferredArchetype = 'DISTANCE';
  } else if (taskId.includes('read') || taskId.includes('count') || taskId === 'quest-008') {
    inferredArchetype = 'COUNT';
  } else if (taskId.includes('build') || taskId.includes('ship') || taskId === 'quest-042' || taskId === 'quest-060') {
    inferredArchetype = 'BUILD';
  } else if (taskId.includes('call') || taskId.includes('presence') || taskId === 'quest-021') {
    inferredArchetype = 'ACTION';
  } else if (taskId.includes('lift') || taskId.includes('workout') || taskId === 'quest-033') {
    inferredArchetype = 'SKILL';
  } else {
    inferredArchetype = inferQuestArchetype(taskId, 'FOCUS');
  }

  const archetype = inferredArchetype;
  const archetypeConfig = QUEST_ARCHETYPES[archetype];

  // Attribute Key
  const rawAttr: ArcAttributeKey =
    paramAttr ||
    starter?.attribute ||
    (archetype === 'DISTANCE' ? 'BODY' : archetype === 'COUNT' ? 'MIND' : archetype === 'ACTION' ? 'PEOPLE' : 'CRAFT');

  // Parse numbers from title if paramTargetValue is missing
  const titleDist = (() => {
    const m = (paramTitle || starter?.title || '').match(/([\d.]+)\s*(KM|K|MILES?|M\b)/i);
    return m ? parseFloat(m[1]) : null;
  })();

  const titleCount = (() => {
    const m = (paramTitle || starter?.title || '').match(/(\d+)\s*(PAGES?|P\b|REPS?|CHAPTERS?|WORDS?|ITEMS?)/i);
    return m ? parseInt(m[1], 10) : null;
  })();

  // Duration
  const durationParam =
    paramDuration ||
    starter?.durationMinutes ||
    (archetype === 'DISTANCE' ? 20 : archetype === 'COUNT' ? 30 : archetype === 'BUILD' ? 60 : archetype === 'ACTION' ? 15 : 45);
  const targetDurationSec = Math.max(60, durationParam * 60);

  // Task Title & Code
  const taskTitle =
    paramTitle ||
    starter?.title ||
    (archetype === 'DISTANCE'
      ? 'TEMPO RUN'
      : archetype === 'COUNT'
      ? 'DEEP READING'
      : archetype === 'BUILD'
      ? 'SHIP FEATURE / MVP'
      : archetype === 'ACTION'
      ? 'GENUINE PRESENCE CALL'
      : archetype === 'SKILL'
      ? 'HEAVY COMPOUND LIFTS'
      : 'DEEP WORK');

  const questCode = starter?.code || '014';

  // Mission Directive 4 Questions Content
  const paramObjective = searchParams.get('objective');
  const paramWhy = searchParams.get('why');

  const questObjective =
    paramObjective ||
    starter?.objective ||
    (archetype === 'FOCUS'
      ? `Sustain ${durationParam} minutes of unbroken cognitive immersion without distraction.`
      : archetype === 'DISTANCE'
      ? `Traverse ${(paramTargetValue || titleDist || starter?.targetValue || 3.0).toFixed(1)} KM of physical ground and record live pace.`
      : archetype === 'COUNT'
      ? `Advance ${paramTargetValue ? Math.round(paramTargetValue) : titleCount || starter?.targetValue || 20} ${paramUnit || starter?.unit || 'Pages'} into the ledger and record takeaways.`
      : archetype === 'BUILD'
      ? 'Ship all architectural checkpoints and record commit / artifact output link.'
      : archetype === 'ACTION'
      ? 'Confront this real-world interaction, record sovereign reflection, and hold to confirm.'
      : 'Log working sets, weights, and technical observations for this practice session.');

  const questWhy =
    paramWhy ||
    starter?.whyItMatters ||
    (archetype === 'FOCUS'
      ? 'Unbroken stillness compounds. Cognitive mastery requires undivided presence.'
      : archetype === 'DISTANCE'
      ? 'Physical aerobic endurance elevates nervous system resilience and mental stamina.'
      : archetype === 'COUNT'
      ? 'Tactile quantity progress defeats cognitive friction and restores deep attention.'
      : archetype === 'BUILD'
      ? 'Artifacts outlive intentions. Tangible shipments create undeniable reality in the world.'
      : archetype === 'ACTION'
      ? 'A sovereign life requires courageous friction in the physical and relational world.'
      : 'Deliberate technical practice under progressive load creates lasting mastery.');

  // Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [reactionPayload, setReactionPayload] = useState<ComicReactionPayload | null>(null);

  // Trigger brief Graphic Novel QUEST ACCEPT flash (<700ms) on entering mission arena
  useEffect(() => {
    setReactionPayload({
      type: 'QUEST_ACCEPT',
      dialogue: 'THEN MOVE.',
    });
  }, []);

  // Archetype 1: FOCUS state
  const [secondsRemaining, setSecondsRemaining] = useState(targetDurationSec);
  const [isFocusRunning, setIsFocusRunning] = useState(true);
  const [timerIntegrityModalOpen, setTimerIntegrityModalOpen] = useState(false);
  const [integrityMessage, setIntegrityMessage] = useState('');

  // Archetype 2: DISTANCE state
  const targetDistance = paramTargetValue || titleDist || starter?.targetValue || 3.0;
  const [distanceValue, setDistanceValue] = useState(0.0);
  const [paceNotes, setPaceNotes] = useState('5:20 /km');
  const [terrain, setTerrain] = useState<'Road' | 'Trail' | 'Track' | 'Treadmill'>('Road');

  // Archetype 3: COUNT state
  const targetCount = paramTargetValue ? Math.round(paramTargetValue) : titleCount || starter?.targetValue || 20;
  const unitLabel = paramUnit || starter?.unit || 'Pages';
  const [countValue, setCountValue] = useState(0);
  const [countNotes, setCountNotes] = useState('');

  // Archetype 4: BUILD state
  const defaultCheckpoints = starter?.checkpoints || [
    'Define data contracts and state boundaries',
    'Implement core algorithms and execution logic',
    'Run automated verification and ship artifact',
  ];
  const [checkpoints, setCheckpoints] = useState<string[]>(defaultCheckpoints);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<string[]>([]);
  const [newCheckpointInput, setNewCheckpointInput] = useState('');
  const [buildArtifactNote, setBuildArtifactNote] = useState('');

  // Archetype 5: ACTION state
  const actionPrompt = starter?.actionPrompt || 'Who did you connect with and what was shared?';
  const [reflectionText, setReflectionText] = useState('');
  const [actionConfirmed, setActionConfirmed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Archetype 6: SKILL state
  const skillPrompt = starter?.skillPrompt || 'Record working sets, weights, reps, and technique observations.';
  const [skillSets, setSkillSets] = useState<SkillSet[]>([
    { id: '1', setNumber: 1, exercise: 'Primary Movement', reps: '5 reps', weight: 'Working Weight', completed: false },
    { id: '2', setNumber: 2, exercise: 'Primary Movement', reps: '5 reps', weight: 'Working Weight', completed: false },
    { id: '3', setNumber: 3, exercise: 'Primary Movement', reps: '5 reps', weight: 'Working Weight', completed: false },
  ]);
  const [skillNotes, setSkillNotes] = useState('');

  // Rewards calculation
  const attributeReward = durationParam >= 45 ? 25 : durationParam >= 30 ? 15 : 10;
  const momentumReward = durationParam >= 45 ? 12 : 6;
  const marksReward = durationParam >= 45 ? 25 : durationParam >= 30 ? 15 : 10;
  const xpReward = durationParam >= 45 ? 60 : durationParam >= 30 ? 40 : 25;

  const whatCountsAsDone =
    archetype === 'FOCUS'
      ? `Complete full ${durationParam} minutes of unbroken focus.`
      : archetype === 'DISTANCE'
      ? `Traverse at least ${targetDistance.toFixed(1)} KM and log pace.`
      : archetype === 'COUNT'
      ? `Record at least ${targetCount} ${unitLabel} in the counter.`
      : archetype === 'BUILD'
      ? `Check off all ${checkpoints.length} milestones & provide artifact link.`
      : archetype === 'ACTION'
      ? 'Record authentic reflection and hold button for 2s to confirm.'
      : `Complete all ${skillSets.length} working sets with technique notes.`;

  // Initialize server focus session if applicable (ONLY FOR FOCUS)
  useEffect(() => {
    if (archetype !== 'FOCUS') return;
    let active = true;
    async function initSession() {
      try {
        const res = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        });
        if (res.ok && active) {
          const data = await res.json();
          setSessionId(data.sessionId);
        }
      } catch (err) {
        console.error('Session start error', err);
      }
    }
    initSession();
    return () => {
      active = false;
    };
  }, [taskId, archetype]);

  // Timer Tick & Server Heartbeats
  useEffect(() => {
    if (isCompleted) return;

    // Non-focus archetypes passively record elapsed duration without countdown timer
    if (archetype !== 'FOCUS') {
      const interval = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }

    // FOCUS mode: countdown timer with server heartbeats
    const interval = setInterval(() => {
      setElapsedSec((prev) => prev + 1);

      if (isFocusRunning) {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            executeCompletion();
            return 0;
          }

          const next = prev - 1;
          if (sessionId && next % 30 === 0) {
            fetch('/api/sessions/heartbeat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId }),
            }).catch(() => {});
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [archetype, isFocusRunning, isCompleted, sessionId]);

  // Hold-to-confirm logic for ACTION archetype
  const handleHoldStart = () => {
    if (actionConfirmed) return;
    const startTime = Date.now();
    const duration = 2000; // 2 seconds hold required

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setActionConfirmed(true);
      }
    }, 30);
  };

  const handleHoldEnd = () => {
    if (holdProgress < 100) {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      setHoldProgress(0);
    }
  };

  // Checkpoints handlers for BUILD
  const toggleCheckpoint = (text: string) => {
    setCompletedCheckpoints((prev) =>
      prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]
    );
  };

  const handleAddCustomCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointInput.trim()) return;
    setCheckpoints((prev) => [...prev, newCheckpointInput.trim()]);
    setNewCheckpointInput('');
  };

  // Skill sets handler
  const toggleSetCompleted = (id: string) => {
    setSkillSets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleAddWorkingSet = () => {
    const nextNum = skillSets.length + 1;
    setSkillSets((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        setNumber: nextNum,
        exercise: skillSets[0]?.exercise || 'Movement Drill',
        reps: '5 reps',
        weight: 'Working Weight',
        completed: false,
      },
    ]);
  };

  // Attempt Quest Completion
  const handleAttemptCompletion = () => {
    // 1. FOCUS Timer Integrity Check
    if (archetype === 'FOCUS') {
      const val = validateQuestCompletion(
        'FOCUS',
        { elapsedDurationSec: elapsedSec },
        { durationMinutes: durationParam }
      );
      if (!val.valid) {
        const completedMin = Math.floor(elapsedSec / 60);
        const remainingMin = Math.max(1, Math.ceil((targetDurationSec - elapsedSec) / 60));
        setIntegrityMessage(`${completedMin} MIN COMPLETED · ${remainingMin} MIN REMAINING · [ CONTINUE QUEST ]`);
        setTimerIntegrityModalOpen(true);
        return;
      }
    }

    // 2. DISTANCE Minimum Check
    if (archetype === 'DISTANCE') {
      const val = validateQuestCompletion(
        'DISTANCE',
        { distanceValue },
        { targetDistance }
      );
      if (!val.valid) return;
    }

    // 3. COUNT Minimum Check
    if (archetype === 'COUNT') {
      const val = validateQuestCompletion(
        'COUNT',
        { countValue },
        { targetCount }
      );
      if (!val.valid) return;
    }

    // 4. BUILD Checkpoints Check
    if (archetype === 'BUILD') {
      const val = validateQuestCompletion(
        'BUILD',
        { completedCheckpoints },
        { requiredCheckpoints: checkpoints.length }
      );
      if (!val.valid) return;
    }

    // 5. ACTION Confirmation Check
    if (archetype === 'ACTION') {
      const val = validateQuestCompletion('ACTION', { confirmed: actionConfirmed });
      if (!val.valid) return;
    }

    // 6. SKILL Output Check
    if (archetype === 'SKILL') {
      const completedSetCount = skillSets.filter((s) => s.completed).length;
      const combinedOutput = `${completedSetCount} working sets logged. Notes: ${skillNotes.trim()}`;
      const val = validateQuestCompletion('SKILL', {
        skillOutput: completedSetCount > 0 ? combinedOutput : skillNotes,
      });
      if (!val.valid) return;
    }

    executeCompletion();
  };

  // Execute server completion API
  const executeCompletion = async () => {
    setIsCompleted(true);
    setIsFocusRunning(false);

    try {
      if (sessionId) {
        await fetch('/api/sessions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }

      const payload = {
        archetype,
        focusSessionId: sessionId,
        elapsedDurationSec: elapsedSec,
        targetDurationSec,
        durationMinutes: durationParam,
        distanceValue,
        targetDistance,
        countValue,
        targetCount,
        completedCheckpoints,
        requiredCheckpoints: checkpoints.length,
        confirmed: actionConfirmed,
        reflection: reflectionText,
        skillOutput: skillNotes || `${skillSets.filter((s) => s.completed).length} sets completed`,
      };

      let completeRes: Response | null = null;
      let completeData: any = null;

      if (!taskId.startsWith('move-') && !taskId.startsWith('quest-') && !taskId.startsWith('custom-')) {
        completeRes = await fetch(`/api/tasks/${taskId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        completeData = await completeRes.json().catch(() => ({}));
      } else {
        // Persist synthetic or starter quest to database for immutable ledger record
        try {
          const dashRes = await fetch('/api/dashboard');
          if (dashRes.ok) {
            const dashData = await dashRes.json();
            const attrMatch = (dashData.attributes || []).find((a: any) => {
              const aName = (a.name || '').toUpperCase();
              return aName.includes(rawAttr) || (rawAttr === 'BODY' && aName.includes('STRENGTH')) || (rawAttr === 'MIND' && aName.includes('INTELLECT'));
            }) || dashData.attributes?.[0];

            if (attrMatch) {
              const createRes = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: taskTitle,
                  attributeId: attrMatch.id,
                }),
              });
              if (createRes.ok) {
                const createdTask = await createRes.json();
                completeRes = await fetch(`/api/tasks/${createdTask.id}/complete`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
                completeData = await completeRes.json().catch(() => ({}));
              }
            }
          }
        } catch (persErr) {
          console.warn('Could not persist quest to database', persErr);
        }
      }

      if (completeRes && !completeRes.ok) {
        setIsCompleted(false);
        setReactionPayload({
          type: 'ACTION_REJECTED',
          rejectionReason: completeData?.reason || completeData?.error || "THAT MOVE DOESN'T COUNT · UNVERIFIED ACTION · NO PROGRESSION AWARDED.",
        });
        return;
      }

      // Authoritative completion confirmed by server
      setReactionPayload({
        type: 'QUEST_COMPLETE',
        questTitle: taskTitle,
        xp: completeData?.xpAwarded || completeData?.earned || xpReward,
        momentum: completeData?.momentumAwarded || momentumReward,
        marks: completeData?.marksAwarded || marksReward,
        attrKey: rawAttr,
        attrPoints: completeData?.xpAwarded || xpReward,
        oldLevel: completeData?.oldLevel,
        newLevel: completeData?.newLevel,
        milestone: completeData?.milestoneReached,
        badge: completeData?.unlockedBadge,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('arc-state-update', {
            detail: {
              marksDelta: completeData?.marksAwarded || marksReward,
            },
          })
        );
      }
    } catch (err) {
      console.error('Error completing quest session', err);
    }
  };

  // Format countdown
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#06090E] text-[#D7DDE4] font-sans flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden selection:bg-[#C5A059]/25">
      {/* Subtle ambient backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-15">
        <Image
          src="/images/arc/arc-focus.jpg"
          alt="Focus Horizon"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#06090E]/90" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto">
        <Link
          href="/quests"
          className="text-[#6B7784] hover:text-[#EDE8DF] transition-colors flex items-center gap-2 text-xs font-mono tracking-widest uppercase cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Exit Arena</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase rounded border ${archetypeConfig.badgeStyle}`}>
            {archetypeConfig.tag}
          </span>
          <span className="font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
            THE ARC · EXECUTION ARENA
          </span>
        </div>
      </header>

      {/* Center Execution Screen */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center max-w-2xl w-full mx-auto py-8">
        {!isCompleted ? (
          <div className="space-y-8 animate-in fade-in duration-700 w-full">
            {/* Quest Header */}
            <div>
              <span className="font-mono text-[10px] tracking-[0.28em] text-[#8B97A6] uppercase block mb-2 font-semibold">
                QUEST {questCode} · {rawAttr} · {archetypeConfig.label.toUpperCase()}
              </span>
              <h1 className="font-display font-semibold text-3xl sm:text-5xl text-[#F2EEE6] tracking-tight uppercase">
                {taskTitle}
              </h1>
              <p className="font-sans text-xs text-[#8B97A6] font-light max-w-md mx-auto mt-2">
                {archetypeConfig.executionPrompt}
              </p>
            </div>

            {/* ═════════════════════════════════════════════════════════
                MISSION DIRECTIVE: THE 4 CORE RPG QUESTIONS
                1. WHAT AM I DOING?
                2. WHY AM I DOING IT?
                3. WHAT COUNTS AS DONE?
                4. WHAT DO I EARN?
            ═════════════════════════════════════════════════════════ */}
            <div className="text-left rounded-lg border border-[#1A2534] bg-[#090D13]/90 backdrop-blur-md p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#141C26]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                  <span className="font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
                    MISSION DIRECTIVE
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#8B97A6] tracking-wider uppercase">
                  THE ARC · SOVEREIGN PROTOCOL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* 1. WHAT AM I DOING? */}
                <div className="p-3 rounded border border-[#141E2B] bg-[#0C121B]/60 space-y-1">
                  <span className="block font-mono text-[9px] tracking-[0.22em] text-[#C5A059] uppercase font-semibold">
                    01 · WHAT AM I DOING?
                  </span>
                  <h3 className="font-display text-sm font-semibold text-[#F2EEE6] uppercase tracking-wide">
                    {taskTitle}
                  </h3>
                  <p className="font-sans text-[11px] text-[#8B97A6] font-light leading-relaxed">
                    {questObjective}
                  </p>
                </div>

                {/* 2. WHY AM I DOING IT? */}
                <div className="p-3 rounded border border-[#141E2B] bg-[#0C121B]/60 space-y-1">
                  <span className="block font-mono text-[9px] tracking-[0.22em] text-[#8B97A6] uppercase font-semibold">
                    02 · WHY AM I DOING IT?
                  </span>
                  <p className="font-sans text-[11px] text-[#EDE8DF] font-light leading-relaxed pt-1">
                    {questWhy}
                  </p>
                </div>

                {/* 3. WHAT COUNTS AS DONE? */}
                <div className="p-3 rounded border border-[#141E2B] bg-[#0C121B]/60 space-y-1">
                  <span className="block font-mono text-[9px] tracking-[0.22em] text-[#34D399] uppercase font-semibold">
                    03 · WHAT COUNTS AS DONE?
                  </span>
                  <p className="font-mono text-xs text-[#EDE8DF] font-medium pt-1">
                    {whatCountsAsDone}
                  </p>
                </div>

                {/* 4. WHAT DO I EARN? */}
                <div className="p-3 rounded border border-[#141E2B] bg-[#0C121B]/60 space-y-1">
                  <span className="block font-mono text-[9px] tracking-[0.22em] text-[#C5A059] uppercase font-semibold">
                    04 · WHAT DO I EARN?
                  </span>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-1">
                    <span className="text-[#EDE8DF]">+{attributeReward} {rawAttr}</span>
                    <span className="text-[#38485C]">·</span>
                    <span className="text-[#C5A059]">+{momentumReward} MOM</span>
                    <span className="text-[#38485C]">·</span>
                    <span className="text-[#C5A059]">+{marksReward} MARKS</span>
                    <span className="text-[#38485C]">·</span>
                    <span className="text-[#EDE8DF]">+{xpReward} XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════
                CONSOLE 1: FOCUS (Duration Timer with Timer Integrity)
            ═════════════════════════════════════════════════════════ */}
            {archetype === 'FOCUS' && (
              <div className="space-y-8">
                <div className="py-4">
                  <span className="font-display font-light text-8xl sm:text-9xl text-[#F2EEE6] tracking-tighter tabular-nums drop-shadow-[0_4px_40px_rgba(0,0,0,0.9)]">
                    {timeFormatted}
                  </span>
                  <span className="block font-mono text-xs tracking-[0.35em] text-[#C5A059] uppercase mt-4">
                    {isFocusRunning ? 'FOCUS ACTIVE' : 'PAUSED'}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFocusRunning((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-7 py-3 border border-[#243040] hover:border-[#C5A059] text-xs font-sans tracking-[0.2em] uppercase text-[#EDE8DF] transition-colors rounded cursor-pointer"
                  >
                    {isFocusRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Resume</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAttemptCompletion}
                    className="px-8 py-3 bg-[#121B26] hover:bg-[#182332] text-xs font-sans tracking-[0.2em] uppercase text-[#C5A059] transition-all rounded border border-[#C5A059]/50 shadow-[0_2px_12px_rgba(197,160,89,0.2)] cursor-pointer"
                  >
                    Complete Quest &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                CONSOLE 2: DISTANCE (Live Distance Logger & Pace Verification)
            ═════════════════════════════════════════════════════════ */}
            {archetype === 'DISTANCE' && (
              <div className="space-y-6 max-w-lg mx-auto w-full">
                {/* Huge Target Dial */}
                <div className="p-6 rounded-lg border border-[#1E2938] bg-[#0A0E14] text-center">
                  <span className="text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase block mb-1">
                    TARGET DISTANCE: {targetDistance.toFixed(1)} KM
                  </span>
                  <div className="font-display text-7xl sm:text-8xl font-light text-[#38BDF8] tracking-tight tabular-nums my-2">
                    {distanceValue.toFixed(2)}
                    <span className="text-2xl font-mono text-[#8B97A6] ml-2">KM</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#121B26] h-2 rounded-full overflow-hidden mt-4 border border-[#1E2938]">
                    <div
                      className="bg-gradient-to-r from-[#38BDF8] to-[#0284C7] h-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (distanceValue / targetDistance) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#8B97A6] block mt-2">
                    {Math.min(100, Math.round((distanceValue / targetDistance) * 100))}% OF AEROBIC GROUND COMPLETED
                  </span>
                </div>

                {/* Live Distance Logger Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[0.5, 1.0, 2.0, 5.0].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setDistanceValue((prev) => parseFloat((prev + inc).toFixed(2)))}
                      className="py-3 px-2 border border-[#1E2938] hover:border-[#38BDF8] rounded bg-[#0A0E14] font-mono text-xs text-[#EDE8DF] transition-colors cursor-pointer"
                    >
                      +{inc.toFixed(1)} KM
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDistanceValue((prev) => Math.max(0, parseFloat((prev - 0.5).toFixed(2))))}
                    className="p-3 border border-[#1E2938] hover:border-[#E74C3C] rounded bg-[#0A0E14] text-[#8B97A6] hover:text-[#E74C3C] cursor-pointer"
                    title="Subtract 0.5 KM"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distanceValue || ''}
                    onChange={(e) => setDistanceValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Type exact KM..."
                    className="flex-1 bg-[#0A0E14] border border-[#1E2938] px-4 py-3 text-sm text-[#F2EEE6] font-mono rounded focus:outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    type="button"
                    onClick={() => setDistanceValue(targetDistance)}
                    className="px-4 py-3 border border-[#1E2938] hover:border-[#38BDF8] rounded bg-[#0A0E14] font-mono text-xs text-[#38BDF8] cursor-pointer"
                  >
                    Target Max
                  </button>
                </div>

                {/* Pace & Terrain Notes */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                      Pace / Tempo Notes
                    </label>
                    <input
                      type="text"
                      value={paceNotes}
                      onChange={(e) => setPaceNotes(e.target.value)}
                      placeholder="e.g. 5:15 /km or Zone 2"
                      className="w-full bg-[#0A0E14] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-sans rounded focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                      Terrain / Venue
                    </label>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                      {(['Road', 'Trail', 'Track', 'Treadmill'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTerrain(t)}
                          className={`py-1.5 px-2 rounded border uppercase text-center transition-colors cursor-pointer ${
                            terrain === t
                              ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-[#38BDF8]'
                              : 'border-[#1E2938] text-[#6B7784] hover:text-[#EDE8DF]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Complete Button */}
                <button
                  type="button"
                  disabled={distanceValue < targetDistance}
                  onClick={handleAttemptCompletion}
                  className={`w-full py-4 text-xs font-sans tracking-[0.2em] uppercase font-semibold rounded transition-all cursor-pointer ${
                    distanceValue >= targetDistance
                      ? 'bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080C12] shadow-[0_4px_24px_rgba(56,189,248,0.35)]'
                      : 'bg-[#121B26] text-[#4B5563] border border-[#1E2938] cursor-not-allowed'
                  }`}
                >
                  {distanceValue >= targetDistance
                    ? `Complete Distance Quest (${distanceValue.toFixed(1)} KM) \u2192`
                    : `Traverse ${(targetDistance - distanceValue).toFixed(1)} KM More to Fulfill Target`}
                </button>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                CONSOLE 3: COUNT (Tactile Step Counter & Volume Dial)
            ═════════════════════════════════════════════════════════ */}
            {archetype === 'COUNT' && (
              <div className="space-y-6 max-w-lg mx-auto w-full">
                <div className="p-6 rounded-lg border border-[#1E2938] bg-[#0A0E14] text-center">
                  <span className="text-[10px] font-mono tracking-widest text-[#8B97A6] uppercase block mb-1">
                    TARGET: {targetCount} {unitLabel.toUpperCase()}
                  </span>
                  <div className="font-display text-8xl font-light text-[#34D399] tracking-tight tabular-nums my-2">
                    {countValue}
                    <span className="text-2xl font-mono text-[#8B97A6] ml-2">/ {targetCount}</span>
                  </div>

                  <div className="w-full bg-[#121B26] h-2 rounded-full overflow-hidden mt-4 border border-[#1E2938]">
                    <div
                      className="bg-gradient-to-r from-[#10B981] to-[#34D399] h-full transition-all duration-200"
                      style={{ width: `${Math.min(100, (countValue / targetCount) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#8B97A6] block mt-2">
                    {Math.min(100, Math.round((countValue / targetCount) * 100))}% FULFILLED
                  </span>
                </div>

                {/* Tactile Counter Buttons */}
                <div className="grid grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setCountValue((prev) => Math.max(0, prev - 1))}
                    className="py-4 border border-[#1E2938] hover:border-[#E74C3C] rounded bg-[#0A0E14] font-mono text-sm text-[#8B97A6] hover:text-[#E74C3C] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountValue((prev) => prev + 1)}
                    className="py-4 border border-[#1E2938] hover:border-[#34D399] rounded bg-[#0A0E14] font-mono text-sm text-[#EDE8DF] hover:text-[#34D399] font-bold transition-colors cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountValue((prev) => prev + 5)}
                    className="py-4 border border-[#1E2938] hover:border-[#34D399] rounded bg-[#0A0E14] font-mono text-sm text-[#EDE8DF] hover:text-[#34D399] font-bold transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountValue((prev) => prev + 10)}
                    className="py-4 border border-[#1E2938] hover:border-[#34D399] rounded bg-[#0A0E14] font-mono text-sm text-[#EDE8DF] hover:text-[#34D399] font-bold transition-colors cursor-pointer"
                  >
                    +10
                  </button>
                </div>

                {/* Takeaway Notes */}
                <div className="text-left">
                  <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                    Key Excerpts & Takeaways
                  </label>
                  <textarea
                    rows={2}
                    value={countNotes}
                    onChange={(e) => setCountNotes(e.target.value)}
                    placeholder={`Record key quotes, notes, or milestones during this ${unitLabel} session...`}
                    className="w-full bg-[#0A0E14] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-sans rounded focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                {/* Complete Button */}
                <button
                  type="button"
                  disabled={countValue < targetCount}
                  onClick={handleAttemptCompletion}
                  className={`w-full py-4 text-xs font-sans tracking-[0.2em] uppercase font-semibold rounded transition-all cursor-pointer ${
                    countValue >= targetCount
                      ? 'bg-[#34D399] hover:bg-[#6EE7B7] text-[#080C12] shadow-[0_4px_24px_rgba(52,211,153,0.35)]'
                      : 'bg-[#121B26] text-[#4B5563] border border-[#1E2938] cursor-not-allowed'
                  }`}
                >
                  {countValue >= targetCount
                    ? `Fulfill Quota (${countValue}/${targetCount} ${unitLabel}) \u2192`
                    : `Log ${targetCount - countValue} More ${unitLabel} to Complete`}
                </button>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                CONSOLE 4: BUILD (Outcome-Based Checkpoints Checklist)
            ═════════════════════════════════════════════════════════ */}
            {archetype === 'BUILD' && (
              <div className="space-y-6 max-w-xl mx-auto w-full text-left">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2938]">
                  <span className="font-mono text-xs text-[#8B97A6] uppercase tracking-wider">
                    {completedCheckpoints.length} OF {checkpoints.length} CHECKPOINTS SHIPPED
                  </span>
                  <span className="font-mono text-xs text-[#FBBF24]">
                    {Math.round((completedCheckpoints.length / checkpoints.length) * 100)}%
                  </span>
                </div>

                {/* Checkpoint Items */}
                <div className="space-y-2.5">
                  {checkpoints.map((cp, idx) => {
                    const isDone = completedCheckpoints.includes(cp);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheckpoint(cp)}
                        className={`p-4 rounded-lg border transition-all cursor-pointer flex items-start gap-3.5 ${
                          isDone
                            ? 'border-[#FBBF24]/60 bg-[#FBBF24]/10 text-[#F2EEE6]'
                            : 'border-[#1E2938] bg-[#0A0E14] text-[#8B97A6] hover:border-[#3A4E65]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'border-[#FBBF24] bg-[#FBBF24] text-[#080C12]'
                              : 'border-[#38485C]'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1">
                          <span
                            className={`text-sm font-sans tracking-wide block ${
                              isDone ? 'line-through text-[#EDE8DF]/80' : 'text-[#EDE8DF]'
                            }`}
                          >
                            {cp}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Checkpoint */}
                <form onSubmit={handleAddCustomCheckpoint} className="flex gap-2">
                  <input
                    type="text"
                    value={newCheckpointInput}
                    onChange={(e) => setNewCheckpointInput(e.target.value)}
                    placeholder="Add an architectural checkpoint..."
                    className="flex-1 bg-[#0A0E14] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] rounded focus:outline-none focus:border-[#FBBF24]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#121B26] hover:bg-[#182332] text-xs font-mono uppercase text-[#FBBF24] border border-[#FBBF24]/40 rounded cursor-pointer"
                  >
                    + Add
                  </button>
                </form>

                {/* Commit or Artifact URL */}
                <div>
                  <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                    Artifact Output Note / Commit / PR Link
                  </label>
                  <input
                    type="text"
                    value={buildArtifactNote}
                    onChange={(e) => setBuildArtifactNote(e.target.value)}
                    placeholder="e.g. PR #142 merged, live on staging, or feature commit SHA"
                    className="w-full bg-[#0A0E14] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-sans rounded focus:outline-none focus:border-[#FBBF24]"
                  />
                </div>

                {/* Complete Button */}
                <button
                  type="button"
                  disabled={completedCheckpoints.length < checkpoints.length}
                  onClick={handleAttemptCompletion}
                  className={`w-full py-4 text-xs font-sans tracking-[0.2em] uppercase font-semibold rounded transition-all cursor-pointer ${
                    completedCheckpoints.length >= checkpoints.length
                      ? 'bg-[#FBBF24] hover:bg-[#FCD34D] text-[#080C12] shadow-[0_4px_24px_rgba(251,191,36,0.35)]'
                      : 'bg-[#121B26] text-[#4B5563] border border-[#1E2938] cursor-not-allowed'
                  }`}
                >
                  {completedCheckpoints.length >= checkpoints.length
                    ? `Ship Artifact & Claim Rewards (${completedCheckpoints.length}/${checkpoints.length} Checkpoints) \u2192`
                    : `Complete All ${checkpoints.length} Checkpoints to Ship`}
                </button>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                CONSOLE 5: ACTION (Real-World Reflection & Hold-to-Confirm)
            ═════════════════════════════════════════════════════════ */}
            {archetype === 'ACTION' && (
              <div className="space-y-6 max-w-lg mx-auto w-full text-left">
                <div className="p-4 rounded-lg border border-[#F472B6]/30 bg-[#F472B6]/5 text-center">
                  <span className="font-mono text-[10px] text-[#F472B6] tracking-widest uppercase block mb-1">
                    REAL-WORLD SOVEREIGN ACTION
                  </span>
                  <p className="text-xs text-[#EDE8DF] font-light leading-relaxed">
                    This quest requires physical, relational, or presence-based action in the real world. Act without digital distraction, then deliberately record your truth.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1.5 font-semibold">
                    {actionPrompt}
                  </label>
                  <textarea
                    rows={4}
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Record what was shared, what friction was confronted, or what truth was spoken..."
                    className="w-full bg-[#0A0E14] border border-[#1E2938] p-3.5 text-xs text-[#EDE8DF] font-sans rounded focus:outline-none focus:border-[#F472B6] leading-relaxed"
                  />
                </div>

                {/* Deliberate Hold-To-Confirm Button */}
                <div className="pt-2">
                  <span className="block text-[9px] font-mono text-[#8B97A6] uppercase text-center mb-2">
                    {actionConfirmed
                      ? 'REAL-WORLD COMPLETION CONFIRMED \u2713'
                      : 'PRESS AND HOLD FOR 2 SECONDS TO DELIBERATELY CONFIRM'}
                  </span>

                  <button
                    type="button"
                    onMouseDown={handleHoldStart}
                    onMouseUp={handleHoldEnd}
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={handleHoldStart}
                    onTouchEnd={handleHoldEnd}
                    className={`relative w-full py-5 rounded overflow-hidden border transition-all select-none cursor-pointer flex items-center justify-center gap-2 text-xs font-sans tracking-[0.2em] uppercase font-semibold ${
                      actionConfirmed
                        ? 'border-[#F472B6] bg-[#F472B6] text-[#080C12] shadow-[0_4px_25px_rgba(244,114,182,0.4)]'
                        : 'border-[#F472B6]/60 bg-[#121B26] text-[#F472B6] hover:border-[#F472B6]'
                    }`}
                  >
                    {/* Live Progress Fill */}
                    {!actionConfirmed && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[#F472B6]/30 transition-all duration-75 pointer-events-none"
                        style={{ width: `${holdProgress}%` }}
                      />
                    )}

                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span className="relative z-10">
                      {actionConfirmed ? 'Confirmed Sovereign Action' : 'Hold to Deliberately Confirm'}
                    </span>
                  </button>
                </div>

                {/* Final Submit Button */}
                {actionConfirmed && (
                  <button
                    type="button"
                    onClick={handleAttemptCompletion}
                    className="w-full py-4 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold rounded shadow-[0_4px_24px_rgba(197,160,89,0.35)] transition-all cursor-pointer"
                  >
                    Complete Action Quest & Claim Rewards &rarr;
                  </button>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════
                CONSOLE 6: SKILL (Deliberate Practice & Sets Logger)
            ═════════════════════════════════════════════════════════ */}
            {archetype === 'SKILL' && (
              <div className="space-y-6 max-w-xl mx-auto w-full text-left">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2938]">
                  <span className="font-mono text-xs text-[#8B97A6] uppercase tracking-wider">
                    {skillSets.filter((s) => s.completed).length} OF {skillSets.length} WORKING SETS COMPLETED
                  </span>
                  <button
                    type="button"
                    onClick={handleAddWorkingSet}
                    className="text-xs font-mono uppercase text-[#C5A059] hover:underline cursor-pointer"
                  >
                    + Add Set
                  </button>
                </div>

                {/* Sets List */}
                <div className="space-y-2">
                  {skillSets.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => toggleSetCompleted(s.id)}
                      className={`p-3 rounded border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        s.completed
                          ? 'border-[#C5A059]/60 bg-[#C5A059]/10 text-[#EDE8DF]'
                          : 'border-[#1E2938] bg-[#0A0E14] text-[#8B97A6] hover:border-[#38485C]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                            s.completed
                              ? 'border-[#C5A059] bg-[#C5A059] text-[#080C12]'
                              : 'border-[#38485C]'
                          }`}
                        >
                          {s.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="font-mono text-xs font-bold text-[#F2EEE6]">
                          SET {s.setNumber}
                        </span>
                        <input
                          type="text"
                          value={s.exercise}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSkillSets((prev) =>
                              prev.map((item) => (item.id === s.id ? { ...item, exercise: val } : item))
                            );
                          }}
                          className="bg-transparent border-b border-[#1E2938] text-xs text-[#EDE8DF] font-sans px-1 py-0.5 focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={s.reps}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSkillSets((prev) =>
                              prev.map((item) => (item.id === s.id ? { ...item, reps: val } : item))
                            );
                          }}
                          className="w-16 bg-[#121B26] border border-[#1E2938] text-center text-xs text-[#EDE8DF] font-mono px-1 py-1 rounded"
                        />
                        <input
                          type="text"
                          value={s.weight}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSkillSets((prev) =>
                              prev.map((item) => (item.id === s.id ? { ...item, weight: val } : item))
                            );
                          }}
                          className="w-24 bg-[#121B26] border border-[#1E2938] text-center text-xs text-[#EDE8DF] font-mono px-1 py-1 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technique & Breakthrough Notes */}
                <div>
                  <label className="block text-[9px] font-mono text-[#8B97A6] uppercase mb-1">
                    {skillPrompt}
                  </label>
                  <textarea
                    rows={3}
                    value={skillNotes}
                    onChange={(e) => setSkillNotes(e.target.value)}
                    placeholder="Log technical cues, bar speed, RPE, or breakthroughs during this deliberate practice..."
                    className="w-full bg-[#0A0E14] border border-[#1E2938] px-3 py-2 text-xs text-[#EDE8DF] font-sans rounded focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                {/* Complete Button */}
                <button
                  type="button"
                  onClick={handleAttemptCompletion}
                  className="w-full py-4 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold rounded shadow-[0_4px_24px_rgba(197,160,89,0.35)] transition-all cursor-pointer"
                >
                  Complete Skill Practice Session &rarr;
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════
              QUEST COMPLETION CELEBRATION SEQUENCE
          ═════════════════════════════════════════════════════════ */
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-1000 max-w-md w-full">
            <div className="w-16 h-16 rounded-full border border-[#C5A059] flex items-center justify-center mx-auto text-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.4)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase font-semibold block mb-2">
                QUEST COMPLETE · {archetypeConfig.tag}
              </span>
              <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#F2EEE6] tracking-tight uppercase mb-2">
                {taskTitle}
              </h2>
              <p className="font-mono text-xs text-[#8B97A6]">
                {archetype === 'FOCUS' && `${Math.max(1, Math.round(elapsedSec / 60))} MIN UNBROKEN FOCUS`}
                {archetype === 'DISTANCE' && `${distanceValue.toFixed(1)} KM COMPLETED · ${paceNotes}`}
                {archetype === 'COUNT' && `${countValue} / ${targetCount} ${unitLabel.toUpperCase()} RECORDED`}
                {archetype === 'BUILD' && `${completedCheckpoints.length} CHECKPOINTS SHIPPED`}
                {archetype === 'ACTION' && 'SOVEREIGN REAL-WORLD ACTION CONFIRMED'}
                {archetype === 'SKILL' && `${skillSets.filter((s) => s.completed).length} SETS DELIBERATED`}
              </p>
            </div>

            {/* Rewards Ledger */}
            <div className="p-6 rounded-lg border border-[#1A2534] bg-[#0A0E14] space-y-3 shadow-xl text-left">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[#8B97A6] uppercase">{rawAttr} PROGRESSION</span>
                <span className="text-[#EDE8DF] font-semibold text-sm">+{attributeReward}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs border-t border-[#141C26] pt-3">
                <span className="text-[#8B97A6] uppercase">SOVEREIGN MOMENTUM</span>
                <span className="text-[#C5A059] font-semibold text-sm">+{momentumReward}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs border-t border-[#141C26] pt-3">
                <span className="text-[#8B97A6] uppercase">SOVEREIGN MARKS</span>
                <span className="text-[#C5A059] font-semibold text-sm">+{marksReward}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-xs border-t border-[#141C26] pt-3">
                <span className="text-[#8B97A6] uppercase">ARC XP GAIN</span>
                <span className="text-[#EDE8DF] font-semibold text-sm">+{xpReward} XP</span>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <p className="font-display text-2xl text-[#EDE8DF] tracking-wide mb-3">
                You moved forward.
              </p>
              <button
                type="button"
                onClick={() => router.push('/quests?state=COMPLETED')}
                className="inline-flex items-center justify-center gap-2.5 w-full py-4 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.22em] uppercase font-semibold transition-all rounded shadow-[0_4px_25px_rgba(197,160,89,0.35)] cursor-pointer"
              >
                <span>View in Sovereign Ledger &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => router.push('/quests')}
                className="w-full py-3 border border-[#1E2938] hover:border-[#38485C] text-[#8B97A6] hover:text-[#EDE8DF] text-xs font-mono tracking-widest uppercase transition-colors rounded cursor-pointer"
              >
                Return to Mission Board
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full py-2.5 text-[#6B7784] hover:text-[#EDE8DF] text-[11px] font-mono tracking-wider uppercase transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Context Footer */}
      <footer className="relative z-10 max-w-4xl w-full mx-auto text-center border-t border-[#141B24] pt-6 flex items-center justify-between text-[11px] font-mono text-[#6B7784]">
        <span>EXECUTION ARENA · {archetypeConfig.tag}</span>
        <div className="flex items-center gap-3">
          <span className="text-[#EDE8DF]">+{attributeReward} {rawAttr}</span>
          <span>·</span>
          <span className="text-[#C5A059]">+{marksReward} MARKS</span>
          <span>·</span>
          <span className="text-[#8B97A6]">+{momentumReward} MOMENTUM</span>
        </div>
      </footer>

      {/* ═════════════════════════════════════════════════════════
          TIMER INTEGRITY INTERCEPTOR MODAL (Early Stop Prevention)
      ═════════════════════════════════════════════════════════ */}
      {timerIntegrityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="relative max-w-md w-full bg-[#0C1016] border border-[#E74C3C]/60 shadow-[0_25px_80px_rgba(231,76,60,0.2)] p-6 sm:p-8 rounded-lg text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full border border-[#E74C3C] flex items-center justify-center mx-auto text-[#E74C3C]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <span className="font-mono text-[10px] tracking-[0.25em] text-[#E74C3C] uppercase font-semibold block mb-1">
                TIMER INTEGRITY ACTIVE
              </span>
              <h3 className="font-display font-semibold text-xl text-[#F2EEE6] uppercase tracking-wide">
                Focus Ritual Incomplete
              </h3>
            </div>

            <div className="p-3 bg-[#121B26] border border-[#1E2938] rounded font-mono text-xs text-[#F2EEE6]">
              {integrityMessage}
            </div>

            <p className="text-xs text-[#8B97A6] font-light leading-relaxed">
              Focus quests require unbroken immersion to earn sovereign XP and Marks. Stopping early grants zero rewards. You may continue your immersion or abandon cleanly without penalty.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setTimerIntegrityModalOpen(false);
                  setIsFocusRunning(true);
                }}
                className="w-full py-3.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold rounded transition-colors cursor-pointer"
              >
                [ Continue Quest ]
              </button>

              <button
                type="button"
                onClick={() => router.push('/quests')}
                className="w-full py-3 border border-[#243040] hover:border-[#6B7784] text-xs font-sans tracking-[0.16em] uppercase text-[#8B97A6] hover:text-[#EDE8DF] rounded transition-colors cursor-pointer"
              >
                Abandon Without Penalty (0 XP Lost · 0 Streak Penalty)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          LIVING GRAPHIC NOVEL COMIC REACTION ENGINE
      ═════════════════════════════════════════════════════════ */}
      <ComicReactionEngine
        payload={reactionPayload}
        onClose={() => setReactionPayload(null)}
      />
    </div>
  );
}

