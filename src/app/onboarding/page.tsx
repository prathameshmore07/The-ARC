'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Check,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  BookOpen,
  Hammer,
  Users,
  Clock,
  Compass,
  Crosshair,
  Award,
  ChevronRight,
} from 'lucide-react';
import { ArcAttributeKey, ARC_ATTRIBUTES } from '@/lib/game-engine';
import {
  playTick,
  playImpactBeat,
  playChime,
  playLockSound,
  startAmbientPulse,
  stopAmbientPulse,
  playClimaxFanfare,
  setMuted,
  getIsMuted,
  getAudioContext,
} from '@/lib/sound-effects';

// ── Types ────────────────────────────────────────────────────────
type OnboardingStage =
  | 'OPENING' // Opening Moment: "THE ARC" / "Every journey begins with a choice."
  | 'Q1' // "WHAT DO YOU WANT TO BECOME?"
  | 'Q2' // "WHY DOES THIS MATTER?"
  | 'Q3' // "HOW WILL YOU GET THERE?"
  | 'Q4' // "HOW MUCH TIME CAN YOU GIVE EACH DAY?"
  | 'SYNTHESIS' // Climax Phase A: "UNDERSTANDING YOUR ARC..."
  | 'CLIMAX'; // Climax Phase B: "YOUR STORY STARTS HERE."

interface ArchetypeOption {
  id: string;
  title: string;
  subtitle: string;
  attribute: ArcAttributeKey;
  image: string;
  description: string;
}

interface PurposeOption {
  id: string;
  statement: string;
}

interface DisciplineOption {
  id: string;
  title: string;
  domain: string;
  attribute: ArcAttributeKey;
  description: string;
}

// ── Archetype Definitions ────────────────────────────────────────
const ARCHETYPES: ArchetypeOption[] = [
  {
    id: 'builder',
    title: 'THE MASTER BUILDER',
    subtitle: 'Craft & Architecture',
    attribute: 'CRAFT',
    image: '/images/arc/arc-craft.jpg',
    description: 'Manifest tangible work, design enduring systems, and ship artifacts that leave a permanent mark.',
  },
  {
    id: 'titan',
    title: 'THE RESILIENT TITAN',
    subtitle: 'Bodily Fortitude & Endurance',
    attribute: 'BODY',
    image: '/images/arc/arc-body.jpg',
    description: 'Forge unbreakable stamina, disciplined physical vigor, and absolute sovereignty over your body.',
  },
  {
    id: 'sage',
    title: 'THE SOVEREIGN SAGE',
    subtitle: 'Mind, Depth & Insight',
    attribute: 'MIND',
    image: '/images/arc/arc-mind.jpg',
    description: 'Cultivate deep comprehension, razor-sharp attention, and cognitive clarity against constant noise.',
  },
  {
    id: 'ally',
    title: 'THE GREAT ALLY',
    subtitle: 'Presence & Community',
    attribute: 'PEOPLE',
    image: '/images/arc/arc-people.jpg',
    description: 'Build enduring alliances, lead through unwavering integrity, and give authentic presence to others.',
  },
];

// ── Purpose Options (Q2) ─────────────────────────────────────────
const PURPOSES: PurposeOption[] = [
  {
    id: 'inertia',
    statement: 'To conquer my own inertia and build compounding discipline before time runs out.',
  },
  {
    id: 'monuments',
    statement: 'To build enduring monuments of craft and ship work that outlasts me.',
  },
  {
    id: 'pillar',
    statement: 'To become a pillar of undeniable strength and reliability for the people I care about.',
  },
  {
    id: 'sovereignty',
    statement: 'To reclaim my attention from hollow distractions and achieve sovereignty over my mind.',
  },
];

// ── Disciplines (Q3) ─────────────────────────────────────────────
const DISCIPLINES: DisciplineOption[] = [
  {
    id: 'focus-craft',
    title: 'Deep focus craft sessions',
    domain: 'Craft',
    attribute: 'CRAFT',
    description: 'Uninterrupted deep work blocks dedicated to high-value creation and shipping.',
  },
  {
    id: 'physical-stamina',
    title: 'Physical running & lifting',
    domain: 'Body',
    attribute: 'BODY',
    description: 'Aerobic cadence, iron discipline, and daily physical resilience.',
  },
  {
    id: 'deep-reading',
    title: 'Deep book reading',
    domain: 'Mind',
    attribute: 'MIND',
    description: 'Foundational philosophy, rigorous non-fiction, and zero phone notifications.',
  },
  {
    id: 'software-artifacts',
    title: 'Shipping software artifacts',
    domain: 'Craft',
    attribute: 'CRAFT',
    description: 'Production code, verifiable builds, and tangible live deployments.',
  },
  {
    id: 'real-connection',
    title: 'Real-world connection',
    domain: 'People',
    attribute: 'PEOPLE',
    description: 'Active fellowship, meaningful presence calls, and community stewardship.',
  },
];

// ── Daily Cadence Options (Q4) ───────────────────────────────────
const CADENCES = [
  { value: '15 MIN', minutes: 15, tag: 'THE SPARK', desc: 'Low barrier, zero excuses, momentum builder' },
  { value: '30 MIN', minutes: 30, tag: 'THE STANDARD', desc: 'Balanced depth, sustainable daily compounding' },
  { value: '45 MIN', minutes: 45, tag: 'THE CRUCIBLE', desc: 'High immersion focus, rapid acceleration' },
  { value: '60+ MIN', minutes: 60, tag: 'THE FORGE', desc: 'Deep mastery, serious daily transformation' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();

  // Navigation & Screen State
  const [stage, setStage] = useState<OnboardingStage>('OPENING');
  const [audioMuted, setAudioMuted] = useState(false);

  // Comic Impact Beat State
  const [impactText, setImpactText] = useState<string | null>(null);
  const [impactSubtext, setImpactSubtext] = useState<string | null>(null);

  // User Selections
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>('builder');
  const [customArchetype, setCustomArchetype] = useState<string>('');
  const [isCustomArchetypeOpen, setIsCustomArchetypeOpen] = useState<boolean>(false);

  const [selectedPurpose, setSelectedPurpose] = useState<string>(PURPOSES[0].statement);
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [isCustomPurposeOpen, setIsCustomPurposeOpen] = useState<boolean>(false);

  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([
    'focus-craft',
    'physical-stamina',
    'deep-reading',
  ]);

  const [selectedCadence, setSelectedCadence] = useState<'15 MIN' | '30 MIN' | '45 MIN' | '60+ MIN'>('30 MIN');

  // Synthesis progress counter
  const [synthesisStep, setSynthesisStep] = useState<number>(0);

  // Cleanup ambient audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientPulse();
    };
  }, []);

  // Audio Toggle
  const toggleAudio = () => {
    const nextState = !audioMuted;
    setAudioMuted(nextState);
    setMuted(nextState);
    if (!nextState) {
      playTick();
    }
  };

  // Trigger Comic Impact Beat
  const triggerImpactBeat = (
    text: string,
    subtext: string,
    onComplete: () => void,
    soundType: 'beat' | 'chime' | 'lock' = 'beat'
  ) => {
    setImpactText(text);
    setImpactSubtext(subtext);

    if (soundType === 'beat') {
      playImpactBeat();
      setTimeout(() => playChime(), 180);
    } else if (soundType === 'lock') {
      playLockSound();
      setTimeout(() => playChime(), 320);
    } else {
      playChime();
    }

    setTimeout(() => {
      setImpactText(null);
      setImpactSubtext(null);
      onComplete();
    }, 1100);
  };

  // ── Handler: Begin Opening Moment ──────────────────────────────
  const handleBegin = () => {
    getAudioContext();
    playImpactBeat();
    setTimeout(() => {
      setStage('Q1');
      playTick();
    }, 350);
  };

  // ── Handler: Q1 Archetype Selection ────────────────────────────
  const handleSelectArchetype = (archId: string) => {
    playTick();
    setSelectedArchetypeId(archId);
    setIsCustomArchetypeOpen(false);

    const isBuilder = archId === 'builder';
    const text = isBuilder ? "THEN LET'S BUILD IT." : 'GOOD.';
    const subtext = 'IDENTITY SEED PLANTED';

    triggerImpactBeat(text, subtext, () => {
      setStage('Q2');
    });
  };

  const handleCustomArchetypeSubmit = () => {
    if (!customArchetype.trim()) return;
    playTick();
    setSelectedArchetypeId('custom');

    triggerImpactBeat("THEN LET'S BUILD IT.", 'CUSTOM IDENTITY REGISTERED', () => {
      setStage('Q2');
    });
  };

  // ── Handler: Q2 Purpose Selection ──────────────────────────────
  const handleSelectPurpose = (purpose: string) => {
    playTick();
    setSelectedPurpose(purpose);
    setIsCustomPurposeOpen(false);

    triggerImpactBeat('NOTED. ANCHOR DROPPED.', 'CORE PURPOSE INSCRIBED', () => {
      setStage('Q3');
    });
  };

  const handleCustomPurposeSubmit = () => {
    if (!customPurpose.trim()) return;
    playTick();
    setSelectedPurpose(customPurpose.trim());

    triggerImpactBeat('NOTED. ANCHOR DROPPED.', 'PERSONAL ANCHOR INSCRIBED', () => {
      setStage('Q3');
    });
  };

  // ── Handler: Q3 Disciplines Toggle ─────────────────────────────
  const toggleDiscipline = (discId: string) => {
    playTick();
    setSelectedDisciplines((prev) => {
      if (prev.includes(discId)) {
        if (prev.length > 1) {
          return prev.filter((id) => id !== discId);
        }
        return prev;
      } else {
        return [...prev, discId];
      }
    });
  };

  const handleConfirmDisciplines = () => {
    if (selectedDisciplines.length === 0) return;
    triggerImpactBeat('THE BLUEPRINT TAKES SHAPE.', 'DISCIPLINARY BASELINE ESTABLISHED', () => {
      setStage('Q4');
    });
  };

  // ── Handler: Q4 Cadence Selection ──────────────────────────────
  const handleSelectCadence = (cadence: '15 MIN' | '30 MIN' | '45 MIN' | '60+ MIN') => {
    setSelectedCadence(cadence);

    triggerImpactBeat(
      'DISCIPLINE LOCKED.',
      'DAILY RECURRENCE COMMITTED',
      () => {
        // Transition into Synthesis state
        setStage('SYNTHESIS');
        startAmbientPulse();

        // Staged diagnostic pulse sequence
        setTimeout(() => setSynthesisStep(1), 700);
        setTimeout(() => setSynthesisStep(2), 1400);
        setTimeout(() => {
          stopAmbientPulse();
          setStage('CLIMAX');
          playClimaxFanfare();
        }, 2200);
      },
      'lock'
    );
  };

  // ── Resolved User Identity & Title ─────────────────────────────
  const resolvedArchetype = ARCHETYPES.find((a) => a.id === selectedArchetypeId) || {
    id: 'custom',
    title: customArchetype.trim().toUpperCase() || 'THE SOVEREIGN BUILDER',
    subtitle: 'Custom Inscribed Calling',
    attribute: 'CRAFT' as ArcAttributeKey,
    image: '/images/arc/arc-craft.jpg',
    description: 'A sovereign path forged through deliberate creation and daily discipline.',
  };

  // Computed Baseline Attributes based on selections
  const computedAttributes = {
    CRAFT: 60 + (selectedArchetypeId === 'builder' ? 25 : 0) + (selectedDisciplines.includes('focus-craft') ? 10 : 0) + (selectedDisciplines.includes('software-artifacts') ? 10 : 0),
    BODY: 55 + (selectedArchetypeId === 'titan' ? 25 : 0) + (selectedDisciplines.includes('physical-stamina') ? 15 : 0),
    MIND: 58 + (selectedArchetypeId === 'sage' ? 25 : 0) + (selectedDisciplines.includes('deep-reading') ? 15 : 0),
    PEOPLE: 50 + (selectedArchetypeId === 'ally' ? 25 : 0) + (selectedDisciplines.includes('real-connection') ? 15 : 0),
  };

  // Generated Starter Quests (Diverse archetypes: 1 Focus, 1 Distance/Count, 1 Build/Action)
  const durationNumber = selectedCadence === '15 MIN' ? 15 : selectedCadence === '45 MIN' ? 45 : selectedCadence === '60+ MIN' ? 60 : 30;

  const starterQuests = [
    {
      id: 'quest-focus',
      taskId: 'quest-014',
      type: 'FOCUS RITUAL',
      title: `DEEP WORK · ${selectedCadence}`,
      attr: 'CRAFT' as ArcAttributeKey,
      desc: 'One uninterrupted deep work session on your primary craft. Silence all communications.',
      target: selectedCadence,
      reward: `+18 CRAFT · +8 MOMENTUM · +15 MARKS`,
      image: '/images/arc/arc-craft.jpg',
      isPrimaryFocus: true,
    },
    {
      id: 'quest-distance-count',
      taskId: selectedDisciplines.includes('physical-stamina') ? 'quest-002' : 'quest-008',
      type: 'DISTANCE / COUNT',
      title: selectedDisciplines.includes('physical-stamina') ? 'TEMPO RUN · 3 KM' : 'DEEP READING · 15 PAGES',
      attr: (selectedDisciplines.includes('physical-stamina') ? 'BODY' : 'MIND') as ArcAttributeKey,
      desc: selectedDisciplines.includes('physical-stamina')
        ? 'Clear physical inertia with a steady aerobic cadence outside or on track.'
        : 'Absorb foundational non-fiction text with complete presence and zero device glances.',
      target: selectedDisciplines.includes('physical-stamina') ? '3 KM' : '15 PAGES',
      reward: selectedDisciplines.includes('physical-stamina')
        ? '+14 BODY · +6 MOMENTUM · +10 MARKS'
        : '+14 MIND · +6 MOMENTUM · +10 MARKS',
      image: selectedDisciplines.includes('physical-stamina') ? '/images/arc/arc-body.jpg' : '/images/arc/arc-mind.jpg',
      isPrimaryFocus: false,
    },
    {
      id: 'quest-build-action',
      taskId: selectedDisciplines.includes('real-connection') ? 'quest-021' : 'quest-060',
      type: 'BUILD / ACTION',
      title: selectedDisciplines.includes('real-connection') ? 'GENUINE PRESENCE CALL' : 'SHIP ONE FEATURE',
      attr: (selectedDisciplines.includes('real-connection') ? 'PEOPLE' : 'CRAFT') as ArcAttributeKey,
      desc: selectedDisciplines.includes('real-connection')
        ? 'Reach out to an ally or mentor with undivided presence and zero multitasking.'
        : 'Take a concrete piece of code or architectural artifact and push it to production.',
      target: '1 MILESTONE',
      reward: selectedDisciplines.includes('real-connection')
        ? '+16 PEOPLE · +10 MOMENTUM · +12 MARKS'
        : '+16 CRAFT · +10 MOMENTUM · +12 MARKS',
      image: selectedDisciplines.includes('real-connection') ? '/images/arc/arc-people.jpg' : '/images/arc/arc-artisan.jpg',
      isPrimaryFocus: false,
    },
  ];

  // ── Handler: Enter The Arc ─────────────────────────────────────
  const handleEnterArc = async (directTaskId?: string) => {
    playImpactBeat();

    // Persist Arc state to localStorage
    if (typeof window !== 'undefined') {
      try {
        const arcProfile = {
          archetypeId: selectedArchetypeId,
          archetypeTitle: resolvedArchetype.title,
          purpose: selectedPurpose,
          disciplines: selectedDisciplines,
          cadence: selectedCadence,
          attributes: computedAttributes,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('arc_user_profile', JSON.stringify(arcProfile));
        localStorage.setItem('arc_primary_path', selectedArchetypeId);
        localStorage.setItem('arc_onboarding_completed', 'true');
        localStorage.setItem('arc_starter_quests', JSON.stringify(starterQuests));
      } catch (err) {
        console.error('Failed to save to localStorage', err);
      }
    }

    // Ensure user session exists by attempting demo-login silently if unauthenticated
    try {
      await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resolvedArchetype.title,
        }),
      });
    } catch {
      // Ignore background auth error
    }

    // Navigate to target route
    if (directTaskId) {
      router.push(`/focus/${directTaskId}?attr=${resolvedArchetype.attribute}&duration=${durationNumber}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <main className="min-h-screen bg-[#06090E] text-[#EDE8DF] font-sans relative selection:bg-[#C5A059]/30 selection:text-[#F7F5F0] overflow-x-hidden flex flex-col justify-between">
      {/* ── Graphic Novel Background Texture & Vignette ───────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(rgba(197, 160, 89, 0.08) 1px, transparent 0),
            radial-gradient(circle at 50% 30%, rgba(197, 160, 89, 0.07) 0%, transparent 70%)
          `,
          backgroundSize: '28px 28px, 100% 100%',
        }}
      />
      {/* Restrained Crimson Edge Glow */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059]/80 to-transparent z-20" />
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-[#8F1D1D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Header Strip ──────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#182230]/80">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-[#C5A059]/60 flex items-center justify-center rotate-45 bg-[#0C121B]">
            <div className="w-2.5 h-2.5 bg-[#C5A059] -rotate-45" />
          </div>
          <div>
            <span className="font-display tracking-[0.25em] text-sm uppercase text-[#F7F5F0] font-bold block">
              THE ARC
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#8692A0] uppercase block">
              INITIATION CHRONICLE · NOIR v4
            </span>
          </div>
        </div>

        {/* Audio Toggle & Act Progression */}
        <div className="flex items-center gap-4">
          {stage !== 'OPENING' && stage !== 'SYNTHESIS' && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-[#738090]">
              <span className={stage === 'Q1' ? 'text-[#C5A059] font-bold' : ''}>I. IDENTITY</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'Q2' ? 'text-[#C5A059] font-bold' : ''}>II. ANCHOR</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'Q3' ? 'text-[#C5A059] font-bold' : ''}>III. DISCIPLINES</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'Q4' ? 'text-[#C5A059] font-bold' : ''}>IV. CADENCE</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'CLIMAX' ? 'text-[#C5A059] font-bold' : ''}>FINALE</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleAudio}
            title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#233144] hover:border-[#C5A059]/60 bg-[#0C121C] text-[#8692A0] hover:text-[#EDE8DF] text-[10px] font-mono tracking-wider uppercase transition-colors cursor-pointer"
          >
            {audioMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#A63F3F]" />
                <span className="hidden sm:inline">MUTED</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="hidden sm:inline">AUDIO ON</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Comic Impact Beat Overlay ───────────────────────────────── */}
      <AnimatePresence>
        {impactText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#06090E]/95 backdrop-blur-md p-6"
          >
            {/* Radial Impact Shockwave */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'repeating-conic-gradient(from 0deg, rgba(197, 160, 89, 0.12) 0deg 15deg, transparent 15deg 30deg)',
              }}
            />
            {/* Center Impact Glow Ring */}
            <div className="absolute w-80 h-80 rounded-full border border-[#C5A059]/30 animate-ping opacity-40 pointer-events-none" />

            <div className="relative z-10 max-w-xl text-center">
              <span className="font-mono text-[11px] tracking-[0.32em] text-[#C5A059] uppercase block mb-3 font-semibold">
                {impactSubtext || 'CANON CONFIRMED'}
              </span>
              <h2 className="font-display font-bold text-4xl sm:text-6xl text-[#F7F5F0] tracking-tight uppercase drop-shadow-[0_4px_30px_rgba(197,160,89,0.4)]">
                {impactText}
              </h2>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C5A059]" />
                <div className="w-1.5 h-1.5 bg-[#C5A059] rotate-45" />
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C5A059]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Container ─────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-10 sm:py-16 flex-1 flex flex-col justify-center">
        {/* ═══════════════════════════════════════════════════════════
            SCREEN 0: THE OPENING MOMENT
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'OPENING' && (
          <motion.div
            key="opening"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* Graphic Novel Issue Header */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#243346] bg-[#0A0F16] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
              <span className="font-mono text-[10px] tracking-[0.24em] text-[#98A6B6] uppercase">
                PROLOGUE · THE INITIATION
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display font-semibold text-5xl sm:text-7xl lg:text-8xl text-[#F7F5F0] tracking-tight uppercase leading-[0.95] mb-6">
              THE ARC
            </h1>

            {/* Subtitle with Comic Serif Depth */}
            <p className="font-serif italic text-xl sm:text-2xl text-[#C5A059] max-w-lg mx-auto mb-10 leading-relaxed">
              &ldquo;Every journey begins with a choice.&rdquo;
            </p>

            <p className="font-sans text-sm text-[#8F9BA8] max-w-md mx-auto mb-12 font-light leading-relaxed">
              This is not a checklist or a survey. This is the dramatic beginning of your story. Define the archetype you
              will embody in the ledger.
            </p>

            {/* Cinematic Transition Button: "LET'S BEGIN." */}
            <div className="relative inline-block group">
              {/* Pulsing Radial Impact Beat Glow */}
              <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#C5A059]/40 via-[#8F1D1D]/40 to-[#C5A059]/40 opacity-75 blur group-hover:opacity-100 transition duration-500 group-hover:duration-200 animate-tilt" />

              <button
                type="button"
                onClick={handleBegin}
                className="relative px-10 py-5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-[0.28em] uppercase font-bold transition-all rounded shadow-[0_10px_40px_rgba(197,160,89,0.35)] flex items-center gap-3 cursor-pointer"
              >
                <span>LET&apos;S BEGIN.</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            Q1: WHAT DO YOU WANT TO BECOME?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q1' && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {/* Act Caption */}
            <div className="flex items-center justify-between border-b border-[#182332] pb-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
                  ACT I · THE EMBODIMENT
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                CHAPTER 1 / 4
              </span>
            </div>

            {/* Question Title */}
            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              What do you want to become?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8 max-w-xl">
              Don&apos;t think about tasks. Think about the person you want to become.
            </p>

            {/* Archetypes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedArchetypeId === arch.id && !isCustomArchetypeOpen;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => handleSelectArchetype(arch.id)}
                    className={`relative text-left rounded-lg overflow-hidden border p-5 transition-all cursor-pointer group flex flex-col justify-between h-44 ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#0E1520] ring-1 ring-[#C5A059]/50 shadow-[0_4px_30px_rgba(197,160,89,0.18)]'
                        : 'border-[#1C2736] bg-[#0A0F16] hover:border-[#384A62] hover:bg-[#0E141E]'
                    }`}
                  >
                    {/* Background Artwork */}
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                      <Image
                        src={arch.image}
                        alt={arch.title}
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/80 to-transparent" />
                    </div>

                    {/* Top Tag */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="font-mono text-[9px] tracking-[0.22em] text-[#C5A059] uppercase font-semibold">
                        {arch.subtitle}
                      </span>
                      <span className="font-mono text-[9px] text-[#738090]">
                        [{arch.attribute}]
                      </span>
                    </div>

                    {/* Bottom Title & Description */}
                    <div className="relative z-10 mt-auto">
                      <h3 className="font-display font-semibold text-xl text-[#F7F5F0] uppercase tracking-wide group-hover:text-[#C5A059] transition-colors">
                        {arch.title}
                      </h3>
                      <p className="font-sans text-xs text-[#8A96A6] font-light mt-1 line-clamp-2">
                        {arch.description}
                      </p>
                    </div>

                    {/* Corner Crosshairs */}
                    <div className="absolute top-2 right-2 text-[#28374A] group-hover:text-[#C5A059]/60 transition-colors font-mono text-[10px]">
                      +
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Write-In Accordion */}
            <div className="border border-[#1C2736] rounded-lg bg-[#0A0F16] overflow-hidden mb-6">
              <button
                type="button"
                onClick={() => {
                  playTick();
                  setIsCustomArchetypeOpen(!isCustomArchetypeOpen);
                }}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-mono tracking-wider uppercase text-[#9CA3AF] hover:text-[#F7F5F0] hover:bg-[#0E141E] transition-colors cursor-pointer"
              >
                <span>Or inscribe your custom archetype...</span>
                <span className="text-[#C5A059] text-sm">{isCustomArchetypeOpen ? '−' : '+'}</span>
              </button>

              {isCustomArchetypeOpen && (
                <div className="p-5 border-t border-[#182332] bg-[#070B10]">
                  <label className="block text-[10px] font-mono tracking-widest text-[#738090] uppercase mb-2">
                    CUSTOM IDENTITY TITLE (E.G. THE SILENT CRAFTSMAN, THE RELENTLESS NOMAD)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customArchetype}
                      onChange={(e) => setCustomArchetype(e.target.value)}
                      placeholder="ENTER YOUR ARCHETYPE..."
                      className="flex-1 bg-[#0A0F16] border border-[#233144] focus:border-[#C5A059] px-4 py-3 rounded text-sm text-[#F7F5F0] placeholder-[#505D6E] outline-none font-sans uppercase tracking-wider"
                    />
                    <button
                      type="button"
                      disabled={!customArchetype.trim()}
                      onClick={handleCustomArchetypeSubmit}
                      className="px-6 py-3 bg-[#C5A059] disabled:opacity-40 hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-widest uppercase font-bold transition-all rounded cursor-pointer"
                    >
                      LOCK IN &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            Q2: WHY DOES THIS MATTER?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q2' && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {/* Act Caption */}
            <div className="flex items-center justify-between border-b border-[#182332] pb-4 mb-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setStage('Q1');
                  }}
                  className="text-[10px] font-mono tracking-widest text-[#738090] hover:text-[#C5A059] uppercase transition-colors cursor-pointer"
                >
                  &larr; BACK
                </button>
                <span className="text-[#324050]">|</span>
                <span className="font-mono text-[11px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
                  ACT II · THE ANCHOR
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                CHAPTER 2 / 4
              </span>
            </div>

            {/* Question Title */}
            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              Why does this matter?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8 max-w-xl">
              Identity requires a reason. Why must you transform?
            </p>

            {/* Presets Grid */}
            <div className="space-y-3 mb-6">
              {PURPOSES.map((item, idx) => {
                const isSelected = selectedPurpose === item.statement && !isCustomPurposeOpen;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPurpose(item.statement)}
                    className={`w-full text-left p-5 rounded-lg border transition-all cursor-pointer group flex items-start gap-4 ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#0E1520] ring-1 ring-[#C5A059]/40 shadow-[0_4px_24px_rgba(197,160,89,0.15)]'
                        : 'border-[#1C2736] bg-[#0A0F16] hover:border-[#384A62] hover:bg-[#0E141E]'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-[#C5A059] tracking-widest mt-1">
                      0{idx + 1}
                    </span>
                    <p className="font-serif text-base sm:text-lg text-[#EDE8DF] group-hover:text-[#F7F5F0] leading-snug flex-1">
                      &ldquo;{item.statement}&rdquo;
                    </p>
                    <span className="shrink-0 text-xs font-mono text-[#738090] group-hover:text-[#C5A059] mt-1">
                      &rarr;
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Reason Toggle */}
            <div className="border border-[#1C2736] rounded-lg bg-[#0A0F16] overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  playTick();
                  setIsCustomPurposeOpen(!isCustomPurposeOpen);
                }}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-mono tracking-wider uppercase text-[#9CA3AF] hover:text-[#F7F5F0] hover:bg-[#0E141E] transition-colors cursor-pointer"
              >
                <span>Or articulate your own real reason...</span>
                <span className="text-[#C5A059] text-sm">{isCustomPurposeOpen ? '−' : '+'}</span>
              </button>

              {isCustomPurposeOpen && (
                <div className="p-5 border-t border-[#182332] bg-[#070B10]">
                  <label className="block text-[10px] font-mono tracking-widest text-[#738090] uppercase mb-2">
                    YOUR UNFILTERED REASON
                  </label>
                  <textarea
                    rows={3}
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    placeholder="Write what drives your transformation..."
                    className="w-full bg-[#0A0F16] border border-[#233144] focus:border-[#C5A059] p-4 rounded text-sm text-[#F7F5F0] placeholder-[#505D6E] outline-none font-sans mb-3"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!customPurpose.trim()}
                      onClick={handleCustomPurposeSubmit}
                      className="px-6 py-3 bg-[#C5A059] disabled:opacity-40 hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-widest uppercase font-bold transition-all rounded cursor-pointer"
                    >
                      DROP ANCHOR &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            Q3: HOW WILL YOU GET THERE?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q3' && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {/* Act Caption */}
            <div className="flex items-center justify-between border-b border-[#182332] pb-4 mb-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setStage('Q2');
                  }}
                  className="text-[10px] font-mono tracking-widest text-[#738090] hover:text-[#C5A059] uppercase transition-colors cursor-pointer"
                >
                  &larr; BACK
                </button>
                <span className="text-[#324050]">|</span>
                <span className="font-mono text-[11px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
                  ACT III · THE DISCIPLINES
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                CHAPTER 3 / 4
              </span>
            </div>

            {/* Question Title */}
            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              How will you get there?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8 max-w-xl">
              Select the disciplines that will forge your new baseline.
            </p>

            {/* Multi-Archetype Disciplines Grid */}
            <div className="space-y-3 mb-8">
              {DISCIPLINES.map((d) => {
                const isSelected = selectedDisciplines.includes(d.id);
                return (
                  <div
                    key={d.id}
                    onClick={() => toggleDiscipline(d.id)}
                    className={`p-4 rounded-lg border flex items-center justify-between gap-4 transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#0E1520] ring-1 ring-[#C5A059]/40 shadow-[0_4px_24px_rgba(197,160,89,0.15)]'
                        : 'border-[#1C2736] bg-[#0A0F16] hover:border-[#384A62] hover:bg-[#0E141E]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Checkbox Icon */}
                      <div
                        className={`w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-[#C5A059] border-[#C5A059] text-[#06090E]'
                            : 'border-[#2D3D52] bg-[#0A0F16]'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-display font-semibold text-base sm:text-lg text-[#F7F5F0] uppercase tracking-wide">
                            {d.title}
                          </h4>
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-[#233144] bg-[#0A0F16] text-[#C5A059] uppercase">
                            {d.domain}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-[#8A96A6] font-light mt-0.5">
                          {d.description}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono text-[9px] text-[#738090] shrink-0 hidden sm:inline">
                      [{d.attribute}]
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Confirm Disciplines Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-mono text-xs text-[#738090]">
                {selectedDisciplines.length} DISCIPLINES SELECTED
              </span>
              <button
                type="button"
                onClick={handleConfirmDisciplines}
                disabled={selectedDisciplines.length === 0}
                className="px-8 py-3.5 bg-[#C5A059] disabled:opacity-40 hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-[0.2em] uppercase font-bold transition-all rounded shadow-[0_2px_14px_rgba(197,160,89,0.3)] cursor-pointer flex items-center gap-2"
              >
                <span>CONFIRM DISCIPLINES</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            Q4: HOW MUCH TIME CAN YOU GIVE EACH DAY?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q4' && (
          <motion.div
            key="q4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            {/* Act Caption */}
            <div className="flex items-center justify-between border-b border-[#182332] pb-4 mb-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setStage('Q3');
                  }}
                  className="text-[10px] font-mono tracking-widest text-[#738090] hover:text-[#C5A059] uppercase transition-colors cursor-pointer"
                >
                  &larr; BACK
                </button>
                <span className="text-[#324050]">|</span>
                <span className="font-mono text-[11px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
                  ACT IV · THE CADENCE
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                CHAPTER 4 / 4
              </span>
            </div>

            {/* Question Title */}
            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              How much time can you give each day?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8 max-w-xl">
              Real progress is built on daily recurrence, not occasional intensity.
            </p>

            {/* Time Commitment Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {CADENCES.map((c) => {
                const isSelected = selectedCadence === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleSelectCadence(c.value)}
                    className={`p-6 rounded-lg border text-center transition-all cursor-pointer group flex flex-col justify-between h-48 ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/10 ring-1 ring-[#C5A059]/50 shadow-[0_4px_30px_rgba(197,160,89,0.2)]'
                        : 'border-[#1C2736] bg-[#0A0F16] hover:border-[#384A62] hover:bg-[#0E141E]'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-[9px] tracking-[0.25em] text-[#C5A059] uppercase font-semibold block mb-2">
                        {c.tag}
                      </span>
                      <span className="block font-display text-4xl sm:text-5xl font-semibold text-[#F7F5F0] group-hover:text-[#C5A059] transition-colors">
                        {c.value}
                      </span>
                    </div>

                    <p className="font-sans text-[11px] text-[#8A96A6] font-light mt-2">
                      {c.desc}
                    </p>

                    <div className="pt-2 border-t border-[#182332] flex items-center justify-center gap-1 text-[10px] font-mono text-[#738090] group-hover:text-[#EDE8DF]">
                      <span>SELECT CADENCE</span>
                      <span>&rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CLIMAX STAGE A: UNDERSTANDING YOUR ARC...
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'SYNTHESIS' && (
          <motion.div
            key="synthesis"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-xl mx-auto py-12"
          >
            {/* Animated Compass / Radar Ring */}
            <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#C5A059]/30 animate-ping opacity-30" />
              <div className="absolute inset-2 rounded-full border border-[#C5A059]/40 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="w-16 h-16 rounded-full bg-[#0C121C] border border-[#C5A059] flex items-center justify-center shadow-[0_0_30px_rgba(197,160,89,0.25)]">
                <Compass className="w-8 h-8 text-[#C5A059] animate-pulse" />
              </div>
            </div>

            <span className="font-mono text-[11px] tracking-[0.32em] text-[#C5A059] uppercase block mb-3 font-semibold">
              SYNTHESIS IN PROGRESS
            </span>
            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-6">
              UNDERSTANDING YOUR ARC...
            </h2>

            {/* Progressive Diagnostic Monologue */}
            <div className="font-mono text-xs text-[#8A96A6] space-y-2 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span>INSCRIBING ARCHETYPE: {resolvedArchetype.title}</span>
              </div>
              {synthesisStep >= 1 && (
                <div className="flex items-center justify-center gap-2 animate-in fade-in duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  <span>CALCULATING ATTRIBUTE MATRIX...</span>
                </div>
              )}
              {synthesisStep >= 2 && (
                <div className="flex items-center justify-center gap-2 animate-in fade-in duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  <span>FORGING STARTER QUEST TRINITY...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CLIMAX STAGE B: YOUR STORY STARTS HERE.
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'CLIMAX' && (
          <motion.div
            key="climax"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full space-y-10"
          >
            {/* Climax Splash Header */}
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-[#0C121B] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span className="font-mono text-[10px] tracking-[0.26em] text-[#C5A059] uppercase font-semibold">
                  CANON ESTABLISHED · THE WAYPOINT OPENS
                </span>
              </div>
              <h2 className="font-display font-bold text-4xl sm:text-6xl text-[#F7F5F0] tracking-tight uppercase leading-tight mb-4">
                YOUR STORY STARTS HERE.
              </h2>
              <p className="font-serif italic text-lg sm:text-xl text-[#C5A059] max-w-lg mx-auto">
                &ldquo;Identity is not discovered. It is forged in the ledger every single day.&rdquo;
              </p>
            </div>

            {/* Generated Arc Dossier */}
            <div className="relative rounded-lg border border-[#C5A059]/50 bg-[#0A0F17] p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Corner crosshairs */}
              <div className="absolute top-2 left-2 text-[#C5A059]/40 font-mono text-xs">┌</div>
              <div className="absolute top-2 right-2 text-[#C5A059]/40 font-mono text-xs">┐</div>
              <div className="absolute bottom-2 left-2 text-[#C5A059]/40 font-mono text-xs">└</div>
              <div className="absolute bottom-2 right-2 text-[#C5A059]/40 font-mono text-xs">┘</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Identity & Cadence */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">
                    <span>GENERATED ARC PROFILE</span>
                    <span>·</span>
                    <span>CADENCE: {selectedCadence} / DAY</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F7F5F0] uppercase tracking-wide mb-3">
                    {resolvedArchetype.title}
                  </h3>

                  {/* Monologue Caption Anchor */}
                  <div className="border-l-2 border-[#C5A059] pl-4 py-1 bg-[#06090E]/60 rounded-r">
                    <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1">
                      CORE ANCHOR
                    </span>
                    <p className="font-serif italic text-sm text-[#EDE8DF]">
                      &ldquo;{selectedPurpose}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Attribute Matrix Breakdown */}
                <div className="border border-[#1E2938] rounded-lg p-4 bg-[#070B11] space-y-2.5">
                  <span className="block text-[9px] font-mono tracking-widest text-[#C5A059] uppercase font-semibold mb-2">
                    BASELINE ATTRIBUTES
                  </span>
                  {(Object.keys(computedAttributes) as ArcAttributeKey[]).map((key) => {
                    const val = computedAttributes[key];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-[#A4B1C2] uppercase">{key}</span>
                          <span className="text-[#EDE8DF] font-semibold">{val} PTS</span>
                        </div>
                        <div className="h-1 bg-[#141C27] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8F1D1D] via-[#C5A059] to-[#D4B57A] rounded-full"
                            style={{ width: `${Math.min(100, (val / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generated 3 Starter Quests */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block">
                    THE INITIATION TRINITY
                  </span>
                  <h3 className="font-display font-semibold text-2xl text-[#F7F5F0] uppercase tracking-wide">
                    Your 3 Starter Quests
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#738090]">
                  3 DIVERSE ARCHETYPES GENERATED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {starterQuests.map((q) => {
                  return (
                    <div
                      key={q.id}
                      className="relative rounded-lg border border-[#1E2938] bg-[#0A0F16] hover:border-[#C5A059]/60 transition-all p-5 flex flex-col justify-between group overflow-hidden"
                    >
                      {/* Top Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] tracking-wider uppercase font-semibold">
                            {q.type}
                          </span>
                          <span className="font-mono text-[9px] text-[#738090] uppercase">
                            [{q.attr}]
                          </span>
                        </div>

                        <h4 className="font-display font-semibold text-lg text-[#F7F5F0] uppercase tracking-wide group-hover:text-[#C5A059] transition-colors mb-2">
                          {q.title}
                        </h4>
                        <p className="font-sans text-xs text-[#8A96A6] font-light leading-relaxed mb-4">
                          {q.desc}
                        </p>
                      </div>

                      {/* Reward & Target */}
                      <div className="pt-3 border-t border-[#16212E]">
                        <div className="text-[10px] font-mono text-[#C5A059] mb-3">
                          {q.reward}
                        </div>
                        {q.isPrimaryFocus ? (
                          <button
                            type="button"
                            onClick={() => handleEnterArc(q.taskId)}
                            className="w-full py-2.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-[10px] font-mono tracking-widest uppercase font-bold transition-all rounded cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>LAUNCH FOCUS NOW</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        ) : (
                          <div className="w-full py-2.5 bg-[#0D141F] border border-[#233144] text-[#8A96A6] text-[10px] font-mono tracking-widest uppercase text-center rounded">
                            READY IN LEDGER
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Action: ENTER YOUR ARC → */}
            <div className="pt-6 pb-12 text-center">
              <button
                type="button"
                onClick={() => handleEnterArc()}
                className="w-full max-w-md mx-auto py-5 bg-gradient-to-r from-[#C5A059] via-[#D8B26E] to-[#C5A059] hover:brightness-110 text-[#06090E] text-xs font-sans tracking-[0.28em] uppercase font-bold transition-all rounded shadow-[0_4px_35px_rgba(197,160,89,0.35)] cursor-pointer flex items-center justify-center gap-3"
              >
                <span>ENTER YOUR ARC</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="font-mono text-[10px] tracking-widest text-[#738090] uppercase block mt-3">
                Inscribes your baseline into the living chronicle &rarr; routes to dashboard
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Graphic Novel Footer Baseline ─────────────────────────── */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between border-t border-[#182230]/60 text-[10px] font-mono tracking-widest text-[#505D6E] uppercase">
        <span>THE ARC · PROTOCOL ARCHIVE 001</span>
        <span>NO MOTIVATIONAL FLUFF · PURE CONCRETE ACTION</span>
      </footer>
    </main>
  );
}
