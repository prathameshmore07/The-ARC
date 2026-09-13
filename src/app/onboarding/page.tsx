'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  ArrowRight,
  RotateCcw,
  Compass,
} from 'lucide-react';
import {
  type ArcAttributeKey,
  ARC_ATTRIBUTES,
  type QuestArchetype,
  QUEST_ARCHETYPES,
  calculateQuestReward,
} from '@/lib/game-engine';
import {
  playTick,
  playImpactBeat,
  playChime,
  playLockSound,
  startAmbientPulse,
  stopAmbientPulse,
  playClimaxFanfare,
  playDialogueAppear,
  setMuted,
  getIsMuted,
  getAudioContext,
} from '@/lib/sound-effects';
import type { ArcSynthesisProfile, GeneratedQuest } from '@/lib/onboarding-ai';
import { type ArcPersonalPlan, getReactiveLineQ1 } from '@/lib/gemini-strategist';

// ── Onboarding Stage Progression (Prologue & Graphic Novel Flow) ─
type OnboardingStage =
  | 'INITIAL_CHECK'   // Verifying if user is already onboarded
  | 'PROLOGUE'        // Establishing prologue: "EVERY ARC BEGINS WITH A CHOICE."
  | 'Q1'              // Chapter I: "WHAT DO YOU WANT TO BECOME?"
  | 'Q2'              // Chapter II: "WHY DOES THIS MATTER?"
  | 'Q3'              // Chapter III: "HOW WILL YOU GET THERE?"
  | 'Q4'              // Chapter IV: "HOW MUCH TIME CAN YOU GIVE EACH DAY?"
  | 'SYNTHESIS'       // "UNDERSTANDING YOUR ARC..."
  | 'REVEAL';         // "YOUR ARC" Dossier & First Moves

const CADENCE_OPTIONS = [
  { value: '15 MIN', minutes: 15, tag: 'THE SPARK', desc: 'Low barrier, zero excuses, momentum builder' },
  { value: '30 MIN', minutes: 30, tag: 'THE STANDARD', desc: 'Balanced depth, sustainable daily compounding' },
  { value: '45 MIN', minutes: 45, tag: 'THE CRUCIBLE', desc: 'High immersion focus, rapid acceleration' },
  { value: '60 MIN', minutes: 60, tag: 'THE FORGE', desc: 'Deep mastery, serious transformation' },
  { value: '90 MIN', minutes: 90, tag: 'THE ASCENT', desc: 'Elite commitment, substantial daily volume' },
  { value: '120+ MIN', minutes: 120, tag: 'THE ODYSSEY', desc: 'Absolute dedication to sovereign craft' },
] as const;

/* Intricate celestial compass rose matching THE ARC landing page */
function CompassRose({ className = 'w-5 h-5 text-[#C5A059]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      <polygon points="50,4 47,40 50,42 53,40" fill="currentColor" />
      <polygon points="50,96 47,60 50,58 53,60" fill="currentColor" />
      <polygon points="4,50 40,47 42,50 40,53" fill="currentColor" />
      <polygon points="96,50 60,47 58,50 60,53" fill="currentColor" />
      <line x1="28" y1="28" x2="72" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="28" x2="28" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="24,24 30,28 28,30" fill="currentColor" />
      <polygon points="76,24 70,28 72,30" fill="currentColor" />
      <polygon points="24,76 30,72 28,70" fill="currentColor" />
      <polygon points="76,76 70,72 72,70" fill="currentColor" />
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();

  // Navigation & Screen State
  const [stage, setStage] = useState<OnboardingStage>('INITIAL_CHECK');
  const [audioMuted, setAudioMuted] = useState(false);

  // User Narrative Answers
  const [q1Become, setQ1Become] = useState('');
  const [q2Why, setQ2Why] = useState('');
  const [q3How, setQ3How] = useState('');
  const [q4Time, setQ4Time] = useState<string>('30 MIN');

  // Graphic Novel Chapter Transition Overlay State
  const [impactOverlay, setImpactOverlay] = useState<{
    text: string;
    subtext?: string;
  } | null>(null);

  // Synthesis & AI State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisError, setSynthesisError] = useState<string | null>(null);
  const [synthesisStep, setSynthesisStep] = useState<number>(0);
  const [profile, setProfile] = useState<ArcSynthesisProfile | null>(null);
  const [plan, setPlan] = useState<ArcPersonalPlan | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  // Textarea auto-focus ref
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Guard: Existing Users Redirect & Draft Restoration ───────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localCompleted = localStorage.getItem('arc_onboarding_completed');
      if (localCompleted === 'true') {
        router.replace('/dashboard');
        return;
      }

      // Restore in-progress answers if available
      try {
        const savedQ1 = sessionStorage.getItem('arc_draft_q1');
        const savedQ2 = sessionStorage.getItem('arc_draft_q2');
        const savedQ3 = sessionStorage.getItem('arc_draft_q3');
        const savedQ4 = sessionStorage.getItem('arc_draft_q4');
        if (savedQ1) setQ1Become(savedQ1);
        if (savedQ2) setQ2Why(savedQ2);
        if (savedQ3) setQ3How(savedQ3);
        if (savedQ4) setQ4Time(savedQ4);
      } catch {}
    }

    async function checkServerStatus() {
      try {
        const res = await fetch('/api/onboarding');
        if (res.ok) {
          const data = await res.json();
          if (data.completed) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('arc_onboarding_completed', 'true');
            }
            router.replace('/dashboard');
            return;
          }
        }
      } catch {
        // Fallback: continue to onboarding
      } finally {
        setStage('PROLOGUE');
      }
    }

    checkServerStatus();
  }, [router]);

  // Sync draft answers to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (q1Become) sessionStorage.setItem('arc_draft_q1', q1Become);
        if (q2Why) sessionStorage.setItem('arc_draft_q2', q2Why);
        if (q3How) sessionStorage.setItem('arc_draft_q3', q3How);
        if (q4Time) sessionStorage.setItem('arc_draft_q4', q4Time);
      } catch {}
    }
  }, [q1Become, q2Why, q3How, q4Time]);

  // Auto-focus textarea on stage change
  useEffect(() => {
    if (stage === 'Q1' || stage === 'Q2' || stage === 'Q3') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbientPulse();
    };
  }, []);

  const toggleAudio = () => {
    const next = !audioMuted;
    setAudioMuted(next);
    setMuted(next);
    if (!next) {
      playTick();
    }
  };

  // ── Restrained Graphic Novel Transition Impact Beat ──────────────
  const triggerTransitionImpact = (
    text: string,
    subtext: string,
    onFinish: () => void,
    durationMs: number = 550
  ) => {
    setImpactOverlay({ text, subtext });
    playImpactBeat();

    setTimeout(() => {
      playTick();
    }, 180);

    setTimeout(() => {
      setImpactOverlay(null);
      onFinish();
    }, durationMs);
  };

  // ── Handlers: Question Transitions ─────────────────────────────
  const handleStartPrologue = () => {
    getAudioContext();
    playDialogueAppear();
    triggerTransitionImpact("LET'S BEGIN.", 'CHRONICLE INITIATED', () => {
      setStage('Q1');
    }, 450);
  };

  const handleSubmitQ1 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q1Become.trim()) return;

    triggerTransitionImpact('THEN WE BEGIN.', 'CHAPTER II UNLOCKED', () => {
      setStage('Q2');
    }, 550);
  };

  const handleSubmitQ2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q2Why.trim()) return;

    triggerTransitionImpact('THEN WE KNOW WHAT DRIVES YOU.', 'CHAPTER III UNLOCKED', () => {
      setStage('Q3');
    }, 550);
  };

  const handleSubmitQ3 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q3How.trim()) return;

    triggerTransitionImpact('NOW WE HAVE A DIRECTION.', 'CHAPTER IV UNLOCKED', () => {
      setStage('Q4');
    }, 550);
  };

  const handleSelectQ4 = (cadence: string) => {
    setQ4Time(cadence);
    playLockSound();

    triggerTransitionImpact('THAT IS ENOUGH TO BEGIN.', 'SYNTHESIS INITIATED', () => {
      setStage('SYNTHESIS');
      runAiSynthesis(cadence);
    }, 550);
  };

  // ── AI Synthesis Execution ─────────────────────────────────────
  const runAiSynthesis = async (cadenceValue: string = q4Time) => {
    setIsSynthesizing(true);
    setSynthesisError(null);
    setSynthesisStep(0);
    startAmbientPulse();

    const step1 = setTimeout(() => setSynthesisStep(1), 500);
    const step2 = setTimeout(() => setSynthesisStep(2), 1100);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q1Become: q1Become.trim(),
          q2Why: q2Why.trim(),
          q3How: q3How.trim(),
          q4Time: cadenceValue,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.profile) {
        throw new Error(data.error || 'The Void interrupted the synthesis');
      }

      setProfile(data.profile);
      if (data.plan) {
        setPlan(data.plan);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('arc_personal_plan', JSON.stringify(data.plan));
          } catch {}
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('arc_user_profile', JSON.stringify(data.profile));
          localStorage.setItem('arc_primary_path', data.profile.primaryPath.toLowerCase());
          localStorage.setItem('arc_onboarding_completed', 'true');
          localStorage.setItem('arc_starter_quests', JSON.stringify(data.profile.firstQuests));
        } catch {}
      }

      setTimeout(() => {
        stopAmbientPulse();
        setStage('REVEAL');
        playClimaxFanfare();
      }, 1600);
    } catch (err: any) {
      stopAmbientPulse();
      console.error('Synthesis error:', err);
      setSynthesisError(err.message || 'Unable to contact the chronicler. Please retry.');
    } finally {
      setIsSynthesizing(false);
      clearTimeout(step1);
      clearTimeout(step2);
    }
  };

  // ── Handler: Final Moment & Launch ─────────────────────────────
  const handleFinalLaunch = (targetTaskId?: string) => {
    setIsLaunching(true);
    playImpactBeat();

    if (typeof window !== 'undefined' && profile) {
      try {
        localStorage.setItem('arc_user_profile', JSON.stringify(profile));
        localStorage.setItem('arc_primary_path', profile.primaryPath.toLowerCase());
        localStorage.setItem('arc_onboarding_completed', 'true');
        localStorage.setItem('arc_starter_quests', JSON.stringify(profile.firstQuests));
        sessionStorage.removeItem('arc_draft_q1');
        sessionStorage.removeItem('arc_draft_q2');
        sessionStorage.removeItem('arc_draft_q3');
        sessionStorage.removeItem('arc_draft_q4');
      } catch {}
    }

    setTimeout(() => {
      if (targetTaskId) {
        router.push(`/focus/${targetTaskId}?duration=${profile?.dailyMinutes || 30}`);
      } else {
        router.push('/dashboard');
      }
    }, 450);
  };

  // Question navigation helpers
  const isQuestionStage = stage === 'Q1' || stage === 'Q2' || stage === 'Q3' || stage === 'Q4';

  return (
    <main className="min-h-screen bg-[#080C12] text-[#EDE8DF] font-sans relative selection:bg-[#C5A059]/30 selection:text-[#F7F5F0] overflow-x-hidden flex flex-col justify-between">
      {/* ── Background Atmospheric Texture & Vignettes ────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(rgba(197, 160, 89, 0.06) 1px, transparent 0),
            radial-gradient(circle at 50% 35%, rgba(197, 160, 89, 0.04) 0%, transparent 70%)
          `,
          backgroundSize: '24px 24px, 100% 100%',
        }}
      />
      {/* Restrained Golden Top Line */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C5A059]/60 to-transparent z-30" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#8F1D1D]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── Quiet Editorial Header ────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#1A2330]/60">
        <div className="flex items-center gap-3">
          <CompassRose className="w-5 h-5 text-[#C5A059]" />
          <div>
            <span className="font-display tracking-[0.25em] text-xs uppercase text-[#F7F5F0] font-semibold">
              THE ARC
            </span>
          </div>
        </div>

        {/* Quiet Chapter Progress Navigation */}
        <div className="flex items-center gap-6">
          {isQuestionStage && (
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono tracking-[0.22em] uppercase">
              <span className={stage === 'Q1' ? 'text-[#C5A059] font-semibold' : 'text-[#8E8B82]'}>
                I — BECOME
              </span>
              <span className="text-[#202B39]">·</span>
              <span className={stage === 'Q2' ? 'text-[#C5A059] font-semibold' : stage === 'Q3' || stage === 'Q4' ? 'text-[#8E8B82]' : 'text-[#3A4553]'}>
                II — REASON
              </span>
              <span className="text-[#202B39]">·</span>
              <span className={stage === 'Q3' ? 'text-[#C5A059] font-semibold' : stage === 'Q4' ? 'text-[#8E8B82]' : 'text-[#3A4553]'}>
                III — DIRECTION
              </span>
              <span className="text-[#202B39]">·</span>
              <span className={stage === 'Q4' ? 'text-[#C5A059] font-semibold' : 'text-[#3A4553]'}>
                IV — TIME
              </span>
            </div>
          )}

          {stage === 'REVEAL' && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-[#C5A059]">
              <span>PROLOGUE COMPLETE</span>
              <span className="text-[#202B39]">·</span>
              <span className="font-semibold">YOUR ARC</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleAudio}
            title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#1E2838] hover:border-[#C5A059]/50 bg-[#0A0F16] text-[#7E8B9B] hover:text-[#EDE8DF] text-[10px] font-mono tracking-widest uppercase transition-colors cursor-pointer"
          >
            {audioMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#8F1D1D]" />
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

      {/* ── Restrained Graphic Novel Chapter Transition Dialogue Scrim ── */}
      <AnimatePresence>
        {impactOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#080C12]/95 backdrop-blur-sm p-6 select-none"
          >
            <div className="relative z-10 max-w-xl text-center space-y-4">
              {impactOverlay.subtext && (
                <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase block font-semibold">
                  {impactOverlay.subtext}
                </span>
              )}
              <h2 className="font-serif italic text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight">
                &ldquo;{impactOverlay.text}&rdquo;
              </h2>
              <div className="pt-2 flex items-center justify-center gap-3">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#C5A059]/60" />
                <div className="w-1 h-1 bg-[#C5A059] rotate-45" />
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#C5A059]/60" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Viewport Content ─────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 sm:py-12 flex-1 flex flex-col justify-center">
        {/* ═══════════════════════════════════════════════════════════
            PROLOGUE: "EVERY ARC BEGINS WITH A CHOICE."
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'PROLOGUE' && (
          <motion.div
            key="prologue"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto"
          >
            {/* Left Side Narrative Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-1">
                <span className="block font-mono text-[10px] tracking-[0.3em] uppercase text-[#C5A059] font-semibold">
                  THE ARC · PROLOGUE
                </span>
                <span className="block font-mono text-[9px] tracking-[0.25em] uppercase text-[#6B7785]">
                  CHARACTER CREATION MOMENT
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl text-[#F7F5F0] tracking-tight leading-[1.08]">
                EVERY ARC BEGINS WITH A CHOICE.
              </h1>

              <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] leading-relaxed max-w-md">
                &ldquo;Before you set foot into the world, the ledger demands to know who you are becoming.&rdquo;
              </p>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleStartPrologue}
                  className="group inline-flex items-center gap-3 px-8 py-3.5 border border-[#C5A059]/50 hover:border-[#C5A059] bg-[#0A0F16] hover:bg-[#C5A059]/10 text-[#F7F5F0] text-xs font-mono tracking-[0.22em] uppercase transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                  <span className="text-[#C5A059] font-semibold">ENTER CHAPTER I — BECOMING</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right Side Atmospheric Artwork Integration */}
            <div className="lg:col-span-6 relative w-full h-72 sm:h-96 lg:h-[420px] select-none pointer-events-none overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/hero_arc_cinematic.jpg"
                  alt="Wanderer approaching the gateway of The Arc"
                  fill
                  priority
                  className="object-cover object-center grayscale contrast-125 opacity-45 mix-blend-luminosity"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#080C12_95%)]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CHAPTER I: BECOMING
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q1' && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto"
          >
            {/* Left Side: Editorial Composition & Writing Surface */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Narrative Metadata */}
              <div className="mb-4">
                <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase block font-semibold mb-1">
                  THE ARC · CHAPTER I
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#6B7785] uppercase block">
                  BECOMING
                </span>
              </div>

              {/* Dramatic Serif Question */}
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] text-[#F7F5F0] tracking-tight leading-[1.08] mb-3">
                WHAT DO YOU WANT TO BECOME?
              </h2>

              {/* Supporting Copy */}
              <p className="font-serif italic text-sm sm:text-base text-[#8E8B82] mb-8">
                &ldquo;Don&apos;t think about tasks. Think about the person you want to become.&rdquo;
              </p>

              {/* Editorial Minimal Writing Surface */}
              <form onSubmit={handleSubmitQ1} className="space-y-6">
                <div className="relative pt-1 pb-2">
                  <span className="block font-serif italic text-xs sm:text-sm text-[#C5A059]/80 mb-2">
                    &ldquo;I want to become...&rdquo;
                  </span>

                  <div className="relative border-b border-[#243042] focus-within:border-[#C5A059] transition-colors duration-300 pb-1">
                    <textarea
                      ref={textareaRef}
                      rows={3}
                      value={q1Become}
                      onChange={(e) => setQ1Become(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSubmitQ1();
                        }
                      }}
                      placeholder="Inscribe the person you want to become (e.g. A sovereign craftsman who ships enduring software monuments)..."
                      className="w-full bg-transparent text-[#F7F5F0] placeholder-[#4A5568] outline-none font-serif text-base sm:text-lg leading-relaxed resize-none transition-all"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#C5A059] scale-x-0 focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[#5A6675]">
                    <span>FREE INSCRIPTION</span>
                    <span>CMD + ENTER</span>
                  </div>
                </div>

                {/* Subtle Editorial Direction Suggestions */}
                <div className="pt-2 border-t border-[#182332]/60">
                  <span className="block text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B7785] mb-2 font-medium">
                    OR BEGIN WITH A DIRECTION
                  </span>
                  <div className="divide-y divide-[#151F2C]">
                    {[
                      { path: 'CRAFT', text: 'A sovereign craftsman who ships enduring software.' },
                      { path: 'BODY', text: 'An unbreakable athlete with tireless stamina.' },
                      { path: 'MIND', text: 'A disciplined seeker of deep understanding.' },
                      { path: 'PEOPLE', text: 'A dependable presence for the people around me.' },
                    ].map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          playTick();
                          setQ1Become(item.text);
                        }}
                        className="w-full py-2.5 flex items-baseline gap-4 text-left group/sug transition-all duration-200 hover:translate-x-1 cursor-pointer"
                      >
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8E8B82] group-hover/sug:text-[#C5A059] transition-colors w-16 shrink-0 font-medium">
                          {item.path}
                        </span>
                        <span className="font-serif text-xs sm:text-sm text-[#9CA3AF] group-hover/sug:text-[#F7F5F0] transition-colors leading-normal">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Narrative CTA */}
                <div className="flex items-center justify-end pt-4">
                  <button
                    type="submit"
                    disabled={!q1Become.trim()}
                    className="group/cta inline-flex items-center gap-3 px-6 py-3 border border-[#C5A059]/40 hover:border-[#C5A059] bg-[#0A0F16] hover:bg-[#C5A059]/10 text-[#EDE8DF] hover:text-[#F7F5F0] text-xs font-mono tracking-[0.22em] uppercase transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span className="text-[#C5A059] font-medium">CONTINUE TO REASON</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side Atmospheric Artwork Integration */}
            <div className="hidden lg:block lg:col-span-5 relative w-full h-[460px] select-none pointer-events-none overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/hero_arc_cinematic.jpg"
                  alt="Atmospheric citadel silhouette"
                  fill
                  priority
                  className="object-cover object-center grayscale contrast-125 opacity-40 mix-blend-luminosity"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#080C12_90%)]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CHAPTER II: REASON
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q2' && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto"
          >
            {/* Left Side: Editorial Composition & Writing Surface */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Narrative Metadata */}
              <div className="mb-4">
                <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase block font-semibold mb-1">
                  THE ARC · CHAPTER II
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#6B7785] uppercase block">
                  REASON
                </span>
              </div>

              {/* Dramatic Serif Question */}
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] text-[#F7F5F0] tracking-tight leading-[1.08] mb-3">
                WHY DOES THIS MATTER?
              </h2>

              {/* Supporting Copy */}
              <p className="font-serif italic text-sm sm:text-base text-[#8E8B82] mb-8">
                &ldquo;What changes if you become that person?&rdquo;
              </p>

              {/* Editorial Minimal Writing Surface */}
              <form onSubmit={handleSubmitQ2} className="space-y-6">
                <div className="relative pt-1 pb-2">
                  <span className="block font-serif italic text-xs sm:text-sm text-[#C5A059]/80 mb-2">
                    &ldquo;Because...&rdquo;
                  </span>

                  <div className="relative border-b border-[#243042] focus-within:border-[#C5A059] transition-colors duration-300 pb-1">
                    <textarea
                      ref={textareaRef}
                      rows={3}
                      value={q2Why}
                      onChange={(e) => setQ2Why(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSubmitQ2();
                        }
                      }}
                      placeholder="Inscribe why this matters to you (e.g. If I do not master discipline now, time will slip away and potential will remain unbuilt)..."
                      className="w-full bg-transparent text-[#F7F5F0] placeholder-[#4A5568] outline-none font-serif text-base sm:text-lg leading-relaxed resize-none transition-all"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#C5A059] scale-x-0 focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[#5A6675]">
                    <span>CORE ANCHOR</span>
                    <span>CMD + ENTER</span>
                  </div>
                </div>

                {/* Subtle Editorial Direction Suggestions */}
                <div className="pt-2 border-t border-[#182332]/60">
                  <span className="block text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B7785] mb-2 font-medium">
                    OR BEGIN WITH AN ANCHOR
                  </span>
                  <div className="divide-y divide-[#151F2C]">
                    {[
                      { path: 'CRAFT', text: 'To build enduring monuments of craft and ship work that outlasts me.' },
                      { path: 'BODY', text: 'To conquer my own inertia and build compounding discipline before time runs out.' },
                      { path: 'MIND', text: 'To reclaim my attention from hollow distractions and achieve sovereignty over my mind.' },
                      { path: 'PEOPLE', text: 'To become a pillar of undeniable reliability for the people I care about.' },
                    ].map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          playTick();
                          setQ2Why(item.text);
                        }}
                        className="w-full py-2.5 flex items-baseline gap-4 text-left group/sug transition-all duration-200 hover:translate-x-1 cursor-pointer"
                      >
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8E8B82] group-hover/sug:text-[#C5A059] transition-colors w-16 shrink-0 font-medium">
                          {item.path}
                        </span>
                        <span className="font-serif text-xs sm:text-sm text-[#9CA3AF] group-hover/sug:text-[#F7F5F0] transition-colors leading-normal">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Row */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      playTick();
                      setStage('Q1');
                    }}
                    className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B7785] hover:text-[#C5A059] transition-colors cursor-pointer"
                  >
                    <span>← CHAPTER I</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!q2Why.trim()}
                    className="group/cta inline-flex items-center gap-3 px-6 py-3 border border-[#C5A059]/40 hover:border-[#C5A059] bg-[#0A0F16] hover:bg-[#C5A059]/10 text-[#EDE8DF] hover:text-[#F7F5F0] text-xs font-mono tracking-[0.22em] uppercase transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span className="text-[#C5A059] font-medium">CONTINUE TO DIRECTION</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side Atmospheric Artwork Integration */}
            <div className="hidden lg:block lg:col-span-5 relative w-full h-[460px] select-none pointer-events-none overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/relic_sanctuary.jpg"
                  alt="Sanctuary of quiet resolve"
                  fill
                  priority
                  className="object-cover object-center grayscale contrast-125 opacity-40 mix-blend-luminosity"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#080C12_90%)]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CHAPTER III: DIRECTION
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q3' && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto"
          >
            {/* Left Side: Editorial Composition & Writing Surface */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Narrative Metadata */}
              <div className="mb-4">
                <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase block font-semibold mb-1">
                  THE ARC · CHAPTER III
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#6B7785] uppercase block">
                  DIRECTION
                </span>
              </div>

              {/* Dramatic Serif Question */}
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] text-[#F7F5F0] tracking-tight leading-[1.08] mb-3">
                HOW WILL YOU GET THERE?
              </h2>

              {/* Supporting Copy */}
              <p className="font-serif italic text-sm sm:text-base text-[#8E8B82] mb-8">
                &ldquo;Think about the habits, skills, projects, people, or challenges that will move you forward.&rdquo;
              </p>

              {/* Editorial Minimal Writing Surface */}
              <form onSubmit={handleSubmitQ3} className="space-y-6">
                <div className="relative pt-1 pb-2">
                  <span className="block font-serif italic text-xs sm:text-sm text-[#C5A059]/80 mb-2">
                    &ldquo;Through daily...&rdquo;
                  </span>

                  <div className="relative border-b border-[#243042] focus-within:border-[#C5A059] transition-colors duration-300 pb-1">
                    <textarea
                      ref={textareaRef}
                      rows={3}
                      value={q3How}
                      onChange={(e) => setQ3How(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSubmitQ3();
                        }
                      }}
                      placeholder="Inscribe the habits and disciplines (e.g. 45-minute unbroken deep work blocks, 5k roadwork three times a week, direct communication)..."
                      className="w-full bg-transparent text-[#F7F5F0] placeholder-[#4A5568] outline-none font-serif text-base sm:text-lg leading-relaxed resize-none transition-all"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#C5A059] scale-x-0 focus-within:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[10px] font-mono tracking-[0.2em] uppercase text-[#5A6675]">
                    <span>TACTICAL BLUEPRINT</span>
                    <span>CMD + ENTER</span>
                  </div>
                </div>

                {/* Subtle Editorial Direction Suggestions */}
                <div className="pt-2 border-t border-[#182332]/60">
                  <span className="block text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B7785] mb-2 font-medium">
                    OR BEGIN WITH DISCIPLINES
                  </span>
                  <div className="divide-y divide-[#151F2C]">
                    {[
                      { path: 'CRAFT', text: 'Unbroken deep work sessions dedicated to shipping production software.' },
                      { path: 'BODY', text: 'Daily physical discipline, roadwork, and heavy progressive resistance.' },
                      { path: 'MIND', text: 'Dedicated non-fiction reading and deep study with zero distraction.' },
                      { path: 'PEOPLE', text: 'Direct, intentional presence and dependable action for my circle.' },
                    ].map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => {
                          playTick();
                          setQ3How((prev) => (prev ? `${prev}, ${item.text}` : item.text));
                        }}
                        className="w-full py-2.5 flex items-baseline gap-4 text-left group/sug transition-all duration-200 hover:translate-x-1 cursor-pointer"
                      >
                        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#8E8B82] group-hover/sug:text-[#C5A059] transition-colors w-16 shrink-0 font-medium">
                          {item.path}
                        </span>
                        <span className="font-serif text-xs sm:text-sm text-[#9CA3AF] group-hover/sug:text-[#F7F5F0] transition-colors leading-normal">
                          + {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Row */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      playTick();
                      setStage('Q2');
                    }}
                    className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B7785] hover:text-[#C5A059] transition-colors cursor-pointer"
                  >
                    <span>← CHAPTER II</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!q3How.trim()}
                    className="group/cta inline-flex items-center gap-3 px-6 py-3 border border-[#C5A059]/40 hover:border-[#C5A059] bg-[#0A0F16] hover:bg-[#C5A059]/10 text-[#EDE8DF] hover:text-[#F7F5F0] text-xs font-mono tracking-[0.22em] uppercase transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    <span className="text-[#C5A059] font-medium">CONTINUE TO TIME</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] transition-transform duration-300 group-hover/cta:translate-x-1" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side Atmospheric Artwork Integration */}
            <div className="hidden lg:block lg:col-span-5 relative w-full h-[460px] select-none pointer-events-none overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/arc/arc-journey.jpg"
                  alt="Ascent pathway through the mountains"
                  fill
                  priority
                  className="object-cover object-center grayscale contrast-125 opacity-40 mix-blend-luminosity"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#080C12_90%)]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            CHAPTER IV: TIME
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q4' && (
          <motion.div
            key="q4"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto"
          >
            {/* Left Side: Editorial Composition & Cadence Selection */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              {/* Narrative Metadata */}
              <div className="mb-4">
                <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase block font-semibold mb-1">
                  THE ARC · CHAPTER IV
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] text-[#6B7785] uppercase block">
                  TIME & COMMITMENT
                </span>
              </div>

              {/* Dramatic Serif Question */}
              <h2 className="font-serif text-3xl sm:text-5xl lg:text-[3.25rem] text-[#F7F5F0] tracking-tight leading-[1.08] mb-3">
                HOW MUCH TIME CAN YOU GIVE EACH DAY?
              </h2>

              {/* Supporting Copy */}
              <p className="font-serif italic text-sm sm:text-base text-[#8E8B82] mb-6">
                &ldquo;Consistency matters more than ambition.&rdquo;
              </p>

              {/* Minimal Editorial Cadence Matrix */}
              <div className="divide-y divide-[#151F2C] border-y border-[#182332]/80 my-2">
                {CADENCE_OPTIONS.map((c) => {
                  const isSelected = q4Time === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        playTick();
                        setQ4Time(c.value);
                      }}
                      className={`w-full py-3 px-2 flex items-center justify-between text-left transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? 'bg-[#C5A059]/10 text-[#F7F5F0]'
                          : 'hover:bg-[#0E141E] text-[#9CA3AF] hover:text-[#EDE8DF]'
                      }`}
                    >
                      <div className="flex items-baseline gap-4 sm:gap-6">
                        <span className={`font-serif text-lg sm:text-xl font-medium tracking-tight ${isSelected ? 'text-[#C5A059]' : 'group-hover:text-[#F7F5F0]'}`}>
                          {c.value}
                        </span>
                        <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#8E8B82]">
                          {c.tag}
                        </span>
                        <span className="hidden sm:inline font-sans text-xs text-[#6B7785] group-hover:text-[#8E8B82] font-light">
                          {c.desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="font-mono text-[10px] tracking-[0.2em] text-[#C5A059] uppercase font-semibold">
                            SELECTED
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-[#3E4A59] group-hover:text-[#C5A059] transition-colors">
                            SELECT →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Row */}
              <div className="flex items-center justify-between pt-6">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setStage('Q3');
                  }}
                  className="inline-flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B7785] hover:text-[#C5A059] transition-colors cursor-pointer"
                >
                  <span>← CHAPTER III</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQ4(q4Time)}
                  className="group/cta inline-flex items-center gap-3 px-8 py-3.5 border border-[#C5A059]/50 hover:border-[#C5A059] bg-[#0A0F16] hover:bg-[#C5A059]/10 text-[#EDE8DF] hover:text-[#F7F5F0] text-xs font-mono tracking-[0.22em] uppercase transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                >
                  <span className="text-[#C5A059] font-semibold">COMMIT & FORGE ARC</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] transition-transform duration-300 group-hover/cta:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Right Side Atmospheric Artwork Integration */}
            <div className="hidden lg:block lg:col-span-5 relative w-full h-[460px] select-none pointer-events-none overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/images/final_gateway_portal.jpg"
                  alt="Celestial gateway of resolve and time"
                  fill
                  priority
                  className="object-cover object-center grayscale contrast-125 opacity-40 mix-blend-luminosity"
                  sizes="40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#080C12] via-transparent to-[#080C12]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#080C12_90%)]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SYNTHESIS: UNDERSTANDING YOUR ARC...
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'SYNTHESIS' && (
          <motion.div
            key="synthesis"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="text-center max-w-lg mx-auto py-12 my-auto"
          >
            {/* Minimal Chronicler Compass Needle */}
            <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#C5A059]/20 animate-ping opacity-25" />
              <div
                className="absolute inset-1 rounded-full border border-[#C5A059]/30 animate-spin"
                style={{ animationDuration: '6s' }}
              />
              <div className="w-14 h-14 rounded-full bg-[#0A0F16] border border-[#C5A059]/60 flex items-center justify-center shadow-[0_0_25px_rgba(197,160,89,0.15)]">
                <Compass className="w-7 h-7 text-[#C5A059] animate-pulse" />
              </div>
            </div>

            <span className="font-mono text-[10px] tracking-[0.32em] text-[#C5A059] uppercase block mb-3 font-semibold">
              SYNTHESIS IN PROGRESS
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#F7F5F0] tracking-tight uppercase mb-6">
              UNDERSTANDING YOUR ARC...
            </h2>

            {/* Progressive Narrative Diagnostics */}
            <div className="font-mono text-xs text-[#8A96A6] space-y-2.5 max-w-sm mx-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span>ANALYZING NARRATIVE INTENT...</span>
              </div>
              {synthesisStep >= 1 && (
                <div className="flex items-center justify-center gap-2 animate-in fade-in duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  <span>CALCULATING SOVEREIGN PATH MATRIX...</span>
                </div>
              )}
              {synthesisStep >= 2 && (
                <div className="flex items-center justify-center gap-2 animate-in fade-in duration-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                  <span>FORGING BESPOKE STARTER QUESTS...</span>
                </div>
              )}
            </div>

            {/* Error & Retry Handling (Preserves all answers) */}
            {synthesisError && (
              <div className="mt-8 p-4 bg-[#8F1D1D]/15 border border-[#8F1D1D]/40 max-w-md mx-auto">
                <p className="font-sans text-xs text-[#FCA5A5] mb-3">
                  {synthesisError}
                </p>
                <button
                  type="button"
                  onClick={() => runAiSynthesis()}
                  className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-mono font-bold uppercase cursor-pointer inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ATTEMPT RE-SYNTHESIS</span>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            REVEAL: YOUR ARC REVEALED
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'REVEAL' && profile && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full space-y-10 my-auto py-6"
          >
            {/* Climax Narrative Header */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase block font-semibold">
                PROLOGUE COMPLETE · ORIGIN INSCRIBED
              </span>
              <h1 className="font-serif text-4xl sm:text-6xl text-[#F7F5F0] tracking-tight uppercase">
                YOUR ARC
              </h1>
              <p className="font-serif italic text-base sm:text-lg text-[#C5A059] max-w-lg mx-auto">
                &ldquo;Identity is not discovered. It is forged in the ledger every single day.&rdquo;
              </p>
            </div>

            {/* Generated Arc Origin Dossier */}
            <div className="relative border border-[#243042] bg-[#0A0F16] p-6 sm:p-8 space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.7)]">
              {/* Becoming */}
              <div>
                <span className="font-mono text-[9px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold block mb-1">
                  BECOMING
                </span>
                <h3 className="font-serif text-2xl sm:text-4xl text-[#F7F5F0] tracking-wide">
                  {profile.identity}
                </h3>
              </div>

              {/* Why It Matters */}
              <div className="border-l border-[#C5A059] pl-4 py-1">
                <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1 font-semibold">
                  WHY IT MATTERS
                </span>
                <p className="font-serif italic text-sm sm:text-base text-[#EDE8DF] leading-relaxed">
                  &ldquo;{profile.whyItMatters}&rdquo;
                </p>
              </div>

              {/* Direction */}
              <div className="border-l border-[#D04A26] pl-4 py-1">
                <span className="block text-[9px] font-mono tracking-widest text-[#D04A26] uppercase mb-1 font-semibold">
                  YOUR DIRECTION
                </span>
                <p className="font-sans text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                  {profile.direction}
                </p>
              </div>

              {/* Paths & Commitment Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#182332]">
                <div>
                  <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1">
                    PRIMARY PATH
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#C5A059]/10 border border-[#C5A059]/40 text-[#C5A059] font-mono text-xs uppercase font-bold">
                      {profile.primaryPath}
                    </span>
                    {profile.secondaryPaths.map((sec) => (
                      <span
                        key={sec}
                        className="px-2 py-0.5 border border-[#233144] text-[#8A96A6] font-mono text-[10px] uppercase"
                      >
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1">
                    DAILY COMMITMENT
                  </span>
                  <span className="font-serif text-xl text-[#F7F5F0] font-medium">
                    {profile.commitment}
                  </span>
                </div>
              </div>
            </div>

            {/* Bespoke First Moves */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block">
                    NOW WE HAVE A DIRECTION.
                  </span>
                  <h3 className="font-serif text-2xl text-[#F7F5F0] uppercase tracking-wide">
                    YOUR FIRST MOVES
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-[#738090]">
                  {profile.firstQuests.length} BESPOKE ACTIONS FORGED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.firstQuests.map((q, idx) => {
                  const cfg = QUEST_ARCHETYPES[q.archetype] || QUEST_ARCHETYPES.FOCUS;
                  const actionVerb =
                    q.archetype === 'DISTANCE'
                      ? 'RUN'
                      : q.archetype === 'COUNT'
                      ? 'READ'
                      : q.archetype === 'BUILD'
                      ? 'BUILD'
                      : q.archetype === 'ACTION'
                      ? 'ACT'
                      : q.archetype === 'SKILL'
                      ? 'TRAIN'
                      : 'FOCUS';

                  return (
                    <div
                      key={q.id || idx}
                      className="border border-[#1E2938] bg-[#0A0F16] hover:border-[#C5A059]/50 transition-all p-5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`font-mono text-[9px] px-2 py-0.5 border tracking-wider uppercase font-semibold ${cfg.badgeStyle}`}>
                            {cfg.tag}
                          </span>
                          <span className="font-mono text-[9px] text-[#738090] uppercase">
                            [{q.attribute}]
                          </span>
                        </div>

                        <h4 className="font-serif text-lg text-[#F7F5F0] uppercase tracking-wide group-hover:text-[#C5A059] transition-colors mb-2">
                          {q.title}
                        </h4>
                        <p className="font-sans text-xs text-[#8A96A6] font-light leading-relaxed mb-4">
                          {q.objective}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#16212E] space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#C5A059]">
                          <span>+{q.rewards.xp} XP · +{q.rewards.marks} MARKS</span>
                          <span>{q.target}</span>
                        </div>

                        {idx === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleFinalLaunch(q.id)}
                            className="w-full py-2.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-[10px] font-mono tracking-widest uppercase font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>LAUNCH {actionVerb} NOW</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        ) : (
                          <div className="w-full py-2 border border-[#1E2838] text-[#8A96A6] text-[10px] font-mono tracking-widest uppercase text-center">
                            READY IN LEDGER
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Launch Action */}
            <div className="pt-6 pb-10 text-center">
              <span className="font-mono text-xs tracking-[0.32em] text-[#C5A059] uppercase block mb-3 font-semibold">
                YOUR ARC BEGINS NOW.
              </span>

              <button
                type="button"
                disabled={isLaunching}
                onClick={() => handleFinalLaunch()}
                className="group inline-flex items-center justify-center gap-3 px-10 py-4.5 border border-[#C5A059] bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-mono tracking-[0.25em] uppercase font-bold transition-all cursor-pointer shadow-[0_4px_30px_rgba(197,160,89,0.25)] active:scale-98 disabled:opacity-50"
              >
                <span>BEGIN YOUR JOURNEY</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 stroke-[2.5]" />
              </button>

              <span className="font-mono text-[10px] tracking-widest text-[#738090] uppercase block mt-3">
                Inscribes your ledger → opens sovereign dashboard
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Graphic Novel Footer ──────────────────────────────────── */}
      <footer className="relative z-20 w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between border-t border-[#1A2330]/50 text-[10px] font-mono tracking-widest text-[#505D6E] uppercase">
        <span>THE ARC · NARRATIVE INITIATION PROTOCOL</span>
        <span>SOVEREIGN LIFE RPG</span>
      </footer>
    </main>
  );
}
