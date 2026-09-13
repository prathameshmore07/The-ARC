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
  Flame,
  Award,
  RotateCcw,
  Activity,
  ChevronRight,
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

// ── Onboarding Stage Progression (Graphic Novel Story Flow) ───────
type OnboardingStage =
  | 'INITIAL_CHECK'   // Verifying if user is already onboarded
  | 'OPENING_PANEL_1' // Dark screen / silhouette / "EVERY ARC BEGINS WITH A CHOICE."
  | 'OPENING_PANEL_2' // World presence appears: "WHO ARE YOU BECOMING?"
  | 'Q1'              // "WHAT DO YOU WANT TO BECOME?"
  | 'Q2'              // "WHY DOES THIS MATTER?"
  | 'Q3'              // "HOW WILL YOU GET THERE?"
  | 'Q4'              // "HOW MUCH TIME CAN YOU GIVE EACH DAY?"
  | 'SYNTHESIS'       // "UNDERSTANDING YOUR ARC..." / "YOUR STORY STARTS HERE."
  | 'REVEAL'          // YOUR ARC / "YOU HAVE A DIRECTION." / FIRST MOVES
  | 'FINAL_LAUNCH';   // "YOUR ARC BEGINS NOW." -> comic impact -> route to dashboard

const CADENCE_OPTIONS = [
  { value: '15 MIN', minutes: 15, tag: 'THE SPARK', desc: 'Low barrier, zero excuses, momentum builder' },
  { value: '30 MIN', minutes: 30, tag: 'THE STANDARD', desc: 'Balanced depth, sustainable daily compounding' },
  { value: '45 MIN', minutes: 45, tag: 'THE CRUCIBLE', desc: 'High immersion focus, rapid acceleration' },
  { value: '60 MIN', minutes: 60, tag: 'THE FORGE', desc: 'Deep mastery, serious transformation' },
  { value: '90 MIN', minutes: 90, tag: 'THE ASCENT', desc: 'Elite commitment, substantial daily volume' },
  { value: '120+ MIN', minutes: 120, tag: 'THE ODYSSEY', desc: 'Absolute dedication to sovereign craft' },
] as const;

export default function OnboardingPage() {
  const router = useRouter();

  // Navigation & Screen State
  const [stage, setStage] = useState<OnboardingStage>('INITIAL_CHECK');
  const [audioMuted, setAudioMuted] = useState(false);

  // User Narrative Answers (Free-text & Choice)
  const [q1Become, setQ1Become] = useState('');
  const [q2Why, setQ2Why] = useState('');
  const [q3How, setQ3How] = useState('');
  const [q4Time, setQ4Time] = useState<string>('30 MIN');

  // Comic Impact Beat State
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

  // ── Guard: Existing Users Redirect ─────────────────────────────
  useEffect(() => {
    // Check localStorage first
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

    // Check server record
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
        setStage('OPENING_PANEL_1');
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

  // ── Trigger Comic Impact Beat (300-700ms transition) ───────────
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
  const handleStartOpening = () => {
    getAudioContext();
    triggerTransitionImpact("LET'S BEGIN.", 'CHRONICLE INITIATED', () => {
      setStage('Q1');
    }, 450);
  };

  const handleSubmitQ1 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q1Become.trim()) return;

    const reaction = getReactiveLineQ1(q1Become);
    triggerTransitionImpact(reaction, 'IDENTITY REGISTERED', () => {
      setStage('Q2');
    }, 550);
  };

  const handleSubmitQ2 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q2Why.trim()) return;

    triggerTransitionImpact("THAT'S YOUR REASON.", 'ANCHOR INSCRIBED', () => {
      setStage('Q3');
    }, 550);
  };

  const handleSubmitQ3 = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q3How.trim()) return;

    triggerTransitionImpact('NOW WE HAVE A DIRECTION.', 'BLUEPRINT ESTABLISHED', () => {
      setStage('Q4');
    }, 550);
  };

  const handleSelectQ4 = (cadence: string) => {
    setQ4Time(cadence);
    playLockSound();

    // Begin AI Synthesis phase
    triggerTransitionImpact('DISCIPLINE LOCKED.', 'COMMITMENT CONFIRMED', () => {
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

    // Timed diagnostic beats
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

      // Transition to Climax Reveal
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

    // Persist to localStorage
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

    // Brief punch celebration, then route
    setTimeout(() => {
      if (targetTaskId) {
        router.push(`/focus/${targetTaskId}?duration=${profile?.dailyMinutes || 30}`);
      } else {
        router.push('/dashboard');
      }
    }, 450);
  };

  return (
    <main className="min-h-screen bg-[#06090E] text-[#EDE8DF] font-sans relative selection:bg-[#C5A059]/30 selection:text-[#F7F5F0] overflow-x-hidden flex flex-col justify-between">
      {/* ── Graphic Novel Background Texture & Subtle Grain ─────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-35"
        style={{
          backgroundImage: `
            radial-gradient(rgba(197, 160, 89, 0.08) 1px, transparent 0),
            radial-gradient(circle at 50% 35%, rgba(197, 160, 89, 0.06) 0%, transparent 70%)
          `,
          backgroundSize: '24px 24px, 100% 100%',
        }}
      />
      {/* Restrained Crimson Edge Glow */}
      <div className="fixed top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#C5A059]/80 to-transparent z-20" />
      <div className="fixed -bottom-40 -left-40 w-96 h-96 bg-[#8F1D1D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Header Strip ──────────────────────────────────────── */}
      <header className="relative z-20 w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#182230]/80">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-[#C5A059]/60 flex items-center justify-center rotate-45 bg-[#0C121B]">
            <div className="w-2.5 h-2.5 bg-[#C5A059] -rotate-45" />
          </div>
          <div>
            <span className="font-display tracking-[0.25em] text-sm uppercase text-[#F7F5F0] font-bold block">
              THE ARC
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] text-[#8692A0] uppercase block">
              SOVEREIGN NARRATIVE INITIATION
            </span>
          </div>
        </div>

        {/* Act Progression & Audio Toggle */}
        <div className="flex items-center gap-4">
          {stage !== 'INITIAL_CHECK' && stage !== 'OPENING_PANEL_1' && stage !== 'OPENING_PANEL_2' && stage !== 'SYNTHESIS' && (
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-[#738090]">
              <span className={stage === 'Q1' ? 'text-[#C5A059] font-bold' : ''}>I. BECOME</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'Q2' ? 'text-[#C5A059] font-bold' : ''}>II. REASON</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'Q3' ? 'text-[#C5A059] font-bold' : ''}>III. DIRECTION</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'Q4' ? 'text-[#C5A059] font-bold' : ''}>IV. TIME</span>
              <span className="text-[#324050]">/</span>
              <span className={stage === 'REVEAL' ? 'text-[#C5A059] font-bold' : ''}>YOUR ARC</span>
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

      {/* ── Graphic Novel Speed-Line Transition Impact Overlay ────── */}
      <AnimatePresence>
        {impactOverlay && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#06090E]/94 backdrop-blur-md p-6 select-none"
          >
            {/* 48-Ray Comic Speed-Line Burst */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
              <svg viewBox="0 0 800 800" className="w-[110vmax] h-[110vmax]" fill="none">
                {Array.from({ length: 48 }).map((_, i) => {
                  const angle = (i * 360) / 48;
                  const isLong = i % 2 === 0;
                  const isGold = i % 4 === 0;
                  return (
                    <line
                      key={i}
                      x1="400"
                      y1="400"
                      x2={400 + 400 * Math.cos((angle * Math.PI) / 180)}
                      y2={400 + 400 * Math.sin((angle * Math.PI) / 180)}
                      stroke={isGold ? '#C5A059' : '#EDE8DF'}
                      strokeOpacity={isGold ? 0.4 : 0.15}
                      strokeWidth={isGold ? 2 : 1}
                      strokeDasharray={isLong ? '8 6' : 'none'}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="relative z-10 max-w-xl text-center">
              {impactOverlay.subtext && (
                <span className="font-mono text-[11px] tracking-[0.32em] text-[#C5A059] uppercase block mb-3 font-semibold">
                  {impactOverlay.subtext}
                </span>
              )}
              <h2 className="font-display font-bold text-4xl sm:text-6xl text-[#F7F5F0] tracking-tight uppercase drop-shadow-[0_4px_30px_rgba(197,160,89,0.4)]">
                {impactOverlay.text}
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
            PANEL 01: "EVERY ARC BEGINS WITH A CHOICE."
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'OPENING_PANEL_1' && (
          <motion.div
            key="panel1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* Subtle environmental silhouette from existing assets */}
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-[#C5A059]/40 mb-8 bg-[#04060A] shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
              <Image
                src="/images/hero_arc_cinematic.jpg"
                alt="Environmental silhouette"
                fill
                priority
                className="object-cover object-center grayscale contrast-150 opacity-40 mix-blend-luminosity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06090E] via-transparent to-[#06090E]/80" />

              {/* Graphic Novel Speech / Caption Box */}
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-lg bg-[#0A0F17]/95 border border-[#C5A059]/40 shadow-[0_4px_24px_rgba(0,0,0,0.8)] text-center">
                <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C5A059] font-semibold block mb-1">
                  PANEL 01 · PROLOGUE
                </span>
                <p className="font-serif italic text-xl sm:text-2xl text-[#F7F5F0]">
                  &ldquo;EVERY ARC BEGINS WITH A CHOICE.&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playDialogueAppear();
                setStage('OPENING_PANEL_2');
              }}
              className="px-9 py-4 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-xs font-mono tracking-[0.25em] uppercase font-bold transition-all rounded shadow-[0_0_30px_rgba(197,160,89,0.3)] flex items-center gap-2.5 mx-auto cursor-pointer"
            >
              <span>CONTINUE</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            PANEL 02: "WHO ARE YOU BECOMING?"
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'OPENING_PANEL_2' && (
          <motion.div
            key="panel2"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="text-center max-w-2xl mx-auto"
          >
            {/* World Presence / Silhouette Treatment */}
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border-2 border-[#C5A059] mb-8 bg-[#04060A] shadow-[0_20px_80px_rgba(197,160,89,0.25)]">
              <Image
                src="/images/manifesto_tableau.jpg"
                alt="World Presence"
                fill
                priority
                className="object-cover object-center grayscale contrast-175 opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06090E] via-transparent to-[#06090E]/60" />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#C5A059] font-bold block mb-3">
                  THE SOVEREIGN VOICE
                </span>
                <h2 className="font-display font-black text-3xl sm:text-5xl text-[#F7F5F0] tracking-wider uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]">
                  &ldquo;WHO ARE YOU BECOMING?&rdquo;
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                getAudioContext();
                triggerTransitionImpact("LET'S BEGIN.", 'CHRONICLE INITIATED', () => {
                  setStage('Q1');
                }, 450);
              }}
              className="px-10 py-4.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-xs font-mono tracking-[0.28em] uppercase font-black transition-all rounded shadow-[0_0_35px_rgba(197,160,89,0.35)] flex items-center gap-3 mx-auto cursor-pointer active:scale-98"
            >
              <span>LET&apos;S BEGIN.</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUESTION 01: WHAT DO YOU WANT TO BECOME?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q1' && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl mx-auto"
          >
            {/* Directional Header */}
            <div className="flex items-center justify-between border-b border-[#182332] pb-4 mb-8">
              <span className="font-mono text-[11px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold">
                QUESTION 01
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                1 / 4
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              WHAT DO YOU WANT TO BECOME?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8">
              &ldquo;Don&apos;t think about tasks. Think about the person you want to become.&rdquo;
            </p>

            <form onSubmit={handleSubmitQ1} className="space-y-6">
              <div className="relative rounded-lg border border-[#233144] focus-within:border-[#C5A059] bg-[#0A0F16] p-4 transition-all focus-within:shadow-[0_0_25px_rgba(197,160,89,0.15)]">
                <textarea
                  autoFocus
                  rows={4}
                  value={q1Become}
                  onChange={(e) => setQ1Become(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSubmitQ1();
                    }
                  }}
                  placeholder="Inscribe the person you want to become (e.g. A relentless software builder who ships clean architectures and leads with quiet discipline)..."
                  className="w-full bg-transparent text-[#F7F5F0] placeholder-[#505D6E] outline-none font-sans text-sm sm:text-base leading-relaxed resize-none"
                />
                <div className="flex items-center justify-between pt-2 border-t border-[#141E2B] text-[10px] font-mono text-[#738090]">
                  <span>FREE-TEXT INSCRIPTION</span>
                  <span>PRESS CMD+ENTER OR CLICK CONTINUE</span>
                </div>
              </div>

              {/* Inspiration Chips */}
              <div className="space-y-2">
                <span className="block text-[10px] font-mono tracking-wider text-[#637282] uppercase">
                  INSPIRATION ARCS (CLICK TO ADOPT):
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'A sovereign craftsman who ships enduring software monuments',
                    'An unbreakable athlete with tireless physical stamina',
                    'A disciplined sage seeking deep comprehension and intellectual mastery',
                    'A dependable pillar of strength and presence for my community',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playTick();
                        setQ1Become(preset);
                      }}
                      className="px-3 py-1.5 rounded border border-[#1A2533] hover:border-[#C5A059]/50 bg-[#090D14] text-[#8692A0] hover:text-[#EDE8DF] text-xs font-sans text-left transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!q1Become.trim()}
                  className="px-8 py-3.5 bg-[#C5A059] disabled:opacity-40 hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-[0.2em] uppercase font-bold transition-all rounded shadow-[0_2px_14px_rgba(197,160,89,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <span>CONTINUE</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUESTION 02: WHY DOES THIS MATTER?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q2' && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl mx-auto"
          >
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
                  QUESTION 02
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                2 / 4
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              WHY DOES THIS MATTER?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8">
              &ldquo;What changes if you become that person?&rdquo;
            </p>

            <form onSubmit={handleSubmitQ2} className="space-y-6">
              <div className="relative rounded-lg border border-[#233144] focus-within:border-[#C5A059] bg-[#0A0F16] p-4 transition-all focus-within:shadow-[0_0_25px_rgba(197,160,89,0.15)]">
                <textarea
                  autoFocus
                  rows={4}
                  value={q2Why}
                  onChange={(e) => setQ2Why(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSubmitQ2();
                    }
                  }}
                  placeholder="Inscribe why this matters to you (e.g. If I don't master discipline now, time will slip away and my potential will remain an unbuilt blueprint)..."
                  className="w-full bg-transparent text-[#F7F5F0] placeholder-[#505D6E] outline-none font-sans text-sm sm:text-base leading-relaxed resize-none"
                />
                <div className="flex items-center justify-between pt-2 border-t border-[#141E2B] text-[10px] font-mono text-[#738090]">
                  <span>CORE ANCHOR</span>
                  <span>PRESS CMD+ENTER OR CLICK CONTINUE</span>
                </div>
              </div>

              {/* Inspiration Chips */}
              <div className="space-y-2">
                <span className="block text-[10px] font-mono tracking-wider text-[#637282] uppercase">
                  ANCHOR PRESETS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'To conquer my own inertia and build compounding discipline before time runs out',
                    'To build enduring monuments of craft and ship work that outlasts me',
                    'To become a pillar of undeniable reliability for the people I care about',
                    'To reclaim my attention from hollow distractions and achieve sovereignty over my mind',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playTick();
                        setQ2Why(preset);
                      }}
                      className="px-3 py-1.5 rounded border border-[#1A2533] hover:border-[#C5A059]/50 bg-[#090D14] text-[#8692A0] hover:text-[#EDE8DF] text-xs font-sans text-left transition-colors cursor-pointer"
                    >
                      &ldquo;{preset}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!q2Why.trim()}
                  className="px-8 py-3.5 bg-[#C5A059] disabled:opacity-40 hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-[0.2em] uppercase font-bold transition-all rounded shadow-[0_2px_14px_rgba(197,160,89,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <span>CONTINUE</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUESTION 03: HOW WILL YOU GET THERE?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q3' && (
          <motion.div
            key="q3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl mx-auto"
          >
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
                  QUESTION 03
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                3 / 4
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              HOW WILL YOU GET THERE?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8">
              &ldquo;Think about the habits, skills, projects, people, or challenges that will move you forward.&rdquo;
            </p>

            <form onSubmit={handleSubmitQ3} className="space-y-6">
              <div className="relative rounded-lg border border-[#233144] focus-within:border-[#C5A059] bg-[#0A0F16] p-4 transition-all focus-within:shadow-[0_0_25px_rgba(197,160,89,0.15)]">
                <textarea
                  autoFocus
                  rows={4}
                  value={q3How}
                  onChange={(e) => setQ3How(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      handleSubmitQ3();
                    }
                  }}
                  placeholder="Inscribe the habits and disciplines (e.g. 45-minute unbroken coding blocks, running 5k three times a week, reading dense technical books, direct communication)..."
                  className="w-full bg-transparent text-[#F7F5F0] placeholder-[#505D6E] outline-none font-sans text-sm sm:text-base leading-relaxed resize-none"
                />
                <div className="flex items-center justify-between pt-2 border-t border-[#141E2B] text-[10px] font-mono text-[#738090]">
                  <span>TACTICAL BLUEPRINT</span>
                  <span>PRESS CMD+ENTER OR CLICK CONTINUE</span>
                </div>
              </div>

              {/* Inspiration Chips */}
              <div className="space-y-2">
                <span className="block text-[10px] font-mono tracking-wider text-[#637282] uppercase">
                  DISCIPLINARY INSPIRATIONS:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Unbroken deep work sessions dedicated to shipping production software',
                    'Running 3 to 5 kilometers and heavy progressive compound lifts',
                    'Reading 20 pages of foundational non-fiction with no phone nearby',
                    'Authentic phone calls and undivided listening with allies',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        playTick();
                        setQ3How((prev) => (prev ? `${prev}, ${preset}` : preset));
                      }}
                      className="px-3 py-1.5 rounded border border-[#1A2533] hover:border-[#C5A059]/50 bg-[#090D14] text-[#8692A0] hover:text-[#EDE8DF] text-xs font-sans text-left transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={!q3How.trim()}
                  className="px-8 py-3.5 bg-[#C5A059] disabled:opacity-40 hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-[0.2em] uppercase font-bold transition-all rounded shadow-[0_2px_14px_rgba(197,160,89,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <span>CONTINUE</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            QUESTION 04: HOW MUCH TIME CAN YOU GIVE EACH DAY?
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'Q4' && (
          <motion.div
            key="q4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
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
                  QUESTION 04
                </span>
              </div>
              <span className="font-mono text-[10px] tracking-widest text-[#738090]">
                4 / 4
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl sm:text-5xl text-[#F7F5F0] tracking-tight uppercase mb-3">
              HOW MUCH TIME CAN YOU GIVE EACH DAY?
            </h2>
            <p className="font-serif italic text-base sm:text-lg text-[#9CA3AF] mb-8">
              &ldquo;Consistency matters more than ambition.&rdquo;
            </p>

            {/* Exact Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {CADENCE_OPTIONS.map((c) => {
                const isSelected = q4Time === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleSelectQ4(c.value)}
                    className={`p-6 rounded-lg border text-left transition-all cursor-pointer group flex flex-col justify-between h-44 ${
                      isSelected
                        ? 'border-[#C5A059] bg-[#C5A059]/10 ring-1 ring-[#C5A059]/50 shadow-[0_4px_30px_rgba(197,160,89,0.2)]'
                        : 'border-[#1C2736] bg-[#0A0F16] hover:border-[#384A62] hover:bg-[#0E141E]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] tracking-[0.25em] text-[#C5A059] uppercase font-semibold">
                          {c.tag}
                        </span>
                        <span className="font-mono text-[10px] text-[#738090] group-hover:text-[#C5A059]">
                          &rarr;
                        </span>
                      </div>
                      <span className="block font-display text-4xl font-semibold text-[#F7F5F0] group-hover:text-[#C5A059] transition-colors">
                        {c.value}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-[#8A96A6] font-light mt-2 line-clamp-2">
                      {c.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SYNTHESIS: UNDERSTANDING YOUR ARC...
        ═══════════════════════════════════════════════════════════ */}
        {stage === 'SYNTHESIS' && (
          <motion.div
            key="synthesis"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-xl mx-auto py-12"
          >
            {/* Animated Radar Compass */}
            <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#C5A059]/30 animate-ping opacity-30" />
              <div
                className="absolute inset-2 rounded-full border border-[#C5A059]/40 animate-spin"
                style={{ animationDuration: '5s' }}
              />
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
              <div className="mt-8 p-4 rounded-lg bg-[#8F1D1D]/20 border border-[#8F1D1D]/50 max-w-md mx-auto">
                <p className="font-sans text-xs text-[#FCA5A5] mb-3">
                  {synthesisError}
                </p>
                <button
                  type="button"
                  onClick={() => runAiSynthesis()}
                  className="px-5 py-2.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-xs font-mono font-bold uppercase rounded cursor-pointer inline-flex items-center gap-2"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="w-full space-y-10"
          >
            {/* Climax Narrative Header */}
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#C5A059]/40 bg-[#0C121B] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                <span className="font-mono text-[10px] tracking-[0.26em] text-[#C5A059] uppercase font-semibold">
                  YOU HAVE A DIRECTION.
                </span>
              </div>
              <h2 className="font-display font-bold text-4xl sm:text-6xl text-[#F7F5F0] tracking-tight uppercase leading-tight mb-3">
                YOUR ARC
              </h2>
              <p className="font-serif italic text-lg sm:text-xl text-[#C5A059] max-w-lg mx-auto">
                &ldquo;Identity is not discovered. It is forged in the ledger every single day.&rdquo;
              </p>
            </div>

            {/* Generated Arc Dossier Card */}
            <div className="relative rounded-xl border border-[#C5A059]/50 bg-[#0A0F17] p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Corner crosshairs */}
              <div className="absolute top-2 left-2 text-[#C5A059]/40 font-mono text-xs">┌</div>
              <div className="absolute top-2 right-2 text-[#C5A059]/40 font-mono text-xs">┐</div>
              <div className="absolute bottom-2 left-2 text-[#C5A059]/40 font-mono text-xs">└</div>
              <div className="absolute bottom-2 right-2 text-[#C5A059]/40 font-mono text-xs">┘</div>

              <div className="space-y-6">
                {/* 1. YOUR ARC (Generated Identity) */}
                <div>
                  <span className="font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold block mb-1">
                    BECOMING
                  </span>
                  <h3 className="font-display font-bold text-2xl sm:text-4xl text-[#F7F5F0] uppercase tracking-wide">
                    {profile.identity}
                  </h3>
                </div>

                {/* 2. WHY IT MATTERS */}
                <div className="border-l-2 border-[#C5A059] pl-4 py-1.5 bg-[#06090E]/60 rounded-r">
                  <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1 font-semibold">
                    WHY IT MATTERS
                  </span>
                  <p className="font-serif italic text-sm sm:text-base text-[#EDE8DF] leading-relaxed">
                    &ldquo;{profile.whyItMatters}&rdquo;
                  </p>
                </div>

                {/* 3. YOUR DIRECTION */}
                <div className="border-l-2 border-[#D04A26] pl-4 py-1.5 bg-[#06090E]/60 rounded-r">
                  <span className="block text-[9px] font-mono tracking-widest text-[#D04A26] uppercase mb-1 font-semibold">
                    YOUR DIRECTION
                  </span>
                  <p className="font-sans text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                    {profile.direction}
                  </p>
                </div>

                {/* 4. PATHS & COMMITMENT ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#182332]">
                  <div>
                    <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1">
                      YOUR PATH
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-[#C5A059]/15 border border-[#C5A059]/50 text-[#C5A059] font-mono text-xs uppercase font-bold">
                        {profile.primaryPath} (PRIMARY)
                      </span>
                      {profile.secondaryPaths.map((sec) => (
                        <span
                          key={sec}
                          className="px-2 py-0.5 rounded bg-[#131B26] border border-[#233144] text-[#8A96A6] font-mono text-[10px] uppercase"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] font-mono tracking-widest text-[#738090] uppercase mb-1">
                      YOUR COMMITMENT
                    </span>
                    <span className="font-display text-xl text-[#F7F5F0] font-semibold">
                      {profile.commitment}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. YOUR FIRST MOVES (3-5 Bespoke Quests) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block">
                    NOW WE KNOW WHERE TO BEGIN.
                  </span>
                  <h3 className="font-display font-semibold text-2xl text-[#F7F5F0] uppercase tracking-wide">
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
                      className="relative rounded-xl border border-[#1E2938] bg-[#0A0F16] hover:border-[#C5A059]/60 transition-all p-5 flex flex-col justify-between group overflow-hidden"
                    >
                      <div>
                        {/* Archetype & Attribute Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className={`font-mono text-[9px] px-2 py-0.5 rounded border tracking-wider uppercase font-semibold ${cfg.badgeStyle}`}>
                            {cfg.tag}
                          </span>
                          <span className="font-mono text-[9px] text-[#738090] uppercase">
                            [{q.attribute}]
                          </span>
                        </div>

                        <h4 className="font-display font-semibold text-lg text-[#F7F5F0] uppercase tracking-wide group-hover:text-[#C5A059] transition-colors mb-2">
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
                            className="w-full py-2.5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-[10px] font-mono tracking-widest uppercase font-bold transition-all rounded cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>LAUNCH {actionVerb} NOW</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-[#0D141F] border border-[#233144] text-[#8A96A6] text-[10px] font-mono tracking-widest uppercase text-center rounded">
                            READY IN LEDGER
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                FINAL MOMENT: YOUR ARC BEGINS NOW.
            ═══════════════════════════════════════════════════════════ */}
            <div className="pt-8 pb-12 text-center">
              <span className="font-mono text-xs tracking-[0.32em] text-[#C5A059] uppercase block mb-3 font-semibold">
                YOUR ARC BEGINS NOW.
              </span>

              <div className="relative inline-block group">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-[#C5A059]/40 via-[#8F1D1D]/40 to-[#C5A059]/40 opacity-70 blur group-hover:opacity-100 transition duration-300" />
                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={() => handleFinalLaunch()}
                  className="relative w-full max-w-md px-10 py-5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#06090E] text-xs font-sans tracking-[0.28em] uppercase font-bold transition-all rounded shadow-[0_10px_40px_rgba(197,160,89,0.35)] cursor-pointer flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
                >
                  <span>BEGIN YOUR JOURNEY &rarr;</span>
                </button>
              </div>

              <span className="font-mono text-[10px] tracking-widest text-[#738090] uppercase block mt-4">
                Inscribes your ledger &rarr; opens sovereign dashboard
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Graphic Novel Footer Baseline ─────────────────────────── */}
      <footer className="relative z-20 w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between border-t border-[#182230]/60 text-[10px] font-mono tracking-widest text-[#505D6E] uppercase">
        <span>THE ARC · NARRATIVE INITIATION PROTOCOL</span>
        <span>SOVEREIGN LIFE RPG</span>
      </footer>
    </main>
  );
}
