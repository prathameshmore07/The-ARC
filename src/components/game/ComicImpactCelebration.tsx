'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Flame, Shield, Award } from 'lucide-react';

export type CelebrationIntensity = 'LIGHT' | 'STANDARD' | 'DEMANDING' | 'MAJOR' | 'MILESTONE';

export interface ComicImpactProps {
  intensity?: CelebrationIntensity;
  questTitle?: string;
  punchText?: string;
  xp?: number;
  momentum?: number;
  marks?: number;
  attrKey?: string;
  attrPoints?: number;
  onComplete: () => void;
  autoPlaySound?: boolean;
}

/**
 * Web Audio API Synthesizer
 * Produces a warm, satisfying low-end impact thump combined with a harmonic golden chord rise.
 * Fully synthesized in-browser with zero external audio assets.
 */
function playComicImpactSound(intensity: CelebrationIntensity) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // ─────────────────────────────────────────────────────────────
    // 1. Warm Low-End Sub-Bass Thump
    // ─────────────────────────────────────────────────────────────
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';

    const baseFreq =
      intensity === 'LIGHT'
        ? 95
        : intensity === 'STANDARD'
        ? 120
        : intensity === 'DEMANDING'
        ? 140
        : intensity === 'MAJOR'
        ? 160
        : 180;

    const subVol =
      intensity === 'LIGHT'
        ? 0.28
        : intensity === 'STANDARD'
        ? 0.42
        : intensity === 'DEMANDING'
        ? 0.52
        : intensity === 'MAJOR'
        ? 0.65
        : 0.72;

    const decayTime =
      intensity === 'LIGHT'
        ? 0.22
        : intensity === 'STANDARD'
        ? 0.32
        : intensity === 'DEMANDING'
        ? 0.4
        : 0.55;

    subOsc.frequency.setValueAtTime(baseFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + decayTime);

    subGain.gain.setValueAtTime(subVol, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + decayTime + 0.05);

    // ─────────────────────────────────────────────────────────────
    // 2. Comic Punch Transient / Tactile Snap
    // ─────────────────────────────────────────────────────────────
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(360, now);
    snapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.07);

    snapGain.gain.setValueAtTime(intensity === 'LIGHT' ? 0.15 : 0.28, now);
    snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(now);
    snapOsc.stop(now + 0.09);

    // ─────────────────────────────────────────────────────────────
    // 3. Harmonic Golden Chord Rise (Pentatonic / Perfect intervals)
    // ─────────────────────────────────────────────────────────────
    const chordTiers: Record<CelebrationIntensity, number[]> = {
      LIGHT: [523.25, 659.25], // C5, E5
      STANDARD: [440.0, 554.37, 659.25], // A4, C#5, E5
      DEMANDING: [329.63, 440.0, 554.37, 659.25], // E4, A4, C#5, E5
      MAJOR: [220.0, 329.63, 440.0, 554.37, 659.25], // A3, E4, A4, C#5, E5
      MILESTONE: [220.0, 277.18, 329.63, 440.0, 554.37, 659.25, 880.0], // A Major cascade
    };

    const notes = chordTiers[intensity] || chordTiers.STANDARD;
    const noteDelayStep = intensity === 'LIGHT' ? 0.03 : 0.04;

    notes.forEach((frequency, index) => {
      const noteStart = now + 0.03 + index * noteDelayStep;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, noteStart);

      const noteDuration = 0.65 + index * 0.08;
      const noteVol = (0.16 / (index * 0.4 + 1)) * (intensity === 'LIGHT' ? 0.6 : 1.0);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(noteVol, noteStart + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration + 0.05);
    });

    // ─────────────────────────────────────────────────────────────
    // 4. Shimmer / Overtone Swell (For Major & Milestone)
    // ─────────────────────────────────────────────────────────────
    if (intensity === 'MAJOR' || intensity === 'MILESTONE') {
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(1108.73, now + 0.1); // C#6
      shimmerOsc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.6); // E6

      shimmerGain.gain.setValueAtTime(0.0001, now + 0.1);
      shimmerGain.gain.linearRampToValueAtTime(0.07, now + 0.25);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmerOsc.start(now + 0.1);
      shimmerOsc.stop(now + 0.95);
    }
  } catch {
    // AudioContext permission error or silent fallback
  }
}

// Embers data for floating particles
const EMBERS = [
  { id: 1, left: '20%', top: '75%', size: 3, delay: 0.1, duration: 1.2 },
  { id: 2, left: '35%', top: '80%', size: 4, delay: 0.2, duration: 1.4 },
  { id: 3, left: '50%', top: '85%', size: 2.5, delay: 0.05, duration: 1.1 },
  { id: 4, left: '65%', top: '78%', size: 3.5, delay: 0.15, duration: 1.3 },
  { id: 5, left: '80%', top: '82%', size: 3, delay: 0.25, duration: 1.5 },
  { id: 6, left: '28%', top: '65%', size: 2, delay: 0.3, duration: 1.2 },
  { id: 7, left: '72%', top: '60%', size: 4, delay: 0.18, duration: 1.35 },
  { id: 8, left: '42%', top: '70%', size: 3, delay: 0.08, duration: 1.45 },
  { id: 9, left: '58%', top: '68%', size: 2.5, delay: 0.22, duration: 1.15 },
  { id: 10, left: '15%', top: '55%', size: 3, delay: 0.12, duration: 1.3 },
];

export default function ComicImpactCelebration({
  intensity = 'STANDARD',
  questTitle,
  punchText,
  xp = 20,
  momentum = 8,
  marks = 15,
  attrKey,
  attrPoints = 5,
  onComplete,
  autoPlaySound = true,
}: ComicImpactProps) {
  const [completed, setCompleted] = useState(false);
  const soundPlayedRef = useRef(false);

  // Compute duration based on intensity (between 1.2s and 1.8s)
  const durationMs =
    intensity === 'LIGHT'
      ? 1250
      : intensity === 'STANDARD'
      ? 1400
      : intensity === 'DEMANDING'
      ? 1550
      : intensity === 'MAJOR'
      ? 1700
      : 1800;

  // Sound trigger on mount
  useEffect(() => {
    if (autoPlaySound && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playComicImpactSound(intensity);
    }
  }, [autoPlaySound, intensity]);

  // Auto-complete timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setCompleted(true);
      onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  // Allow clicking anywhere or pressing key to skip early
  const handleSkip = () => {
    if (!completed) {
      setCompleted(true);
      onComplete();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [completed]);

  // Primary expressive typography text
  const primaryText =
    punchText ||
    (intensity === 'LIGHT'
      ? 'NICE.'
      : intensity === 'STANDARD'
      ? 'QUEST COMPLETE'
      : intensity === 'DEMANDING'
      ? 'FORGED.'
      : intensity === 'MAJOR'
      ? 'ASCENDED.'
      : 'MONUMENTAL.');

  const isMajor = intensity === 'MAJOR' || intensity === 'MILESTONE';

  return (
    <div
      onClick={handleSkip}
      className="fixed inset-0 z-[60] flex items-center justify-center select-none cursor-pointer overflow-hidden bg-[#06090E]/92 backdrop-blur-lg"
      aria-label="Quest completion celebration"
      role="dialog"
    >
      {/* ─────────────────────────────────────────────────────────────
          1. RADIAL BURST BACKGROUND (PRECISION COMIC SPEED-LINES)
      ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
        <svg
          viewBox="0 0 800 800"
          className="w-[120vmax] h-[120vmax] animate-[spin_60s_linear_infinite]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="burst-gold" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C5A059" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#C5A059" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06090E" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="burst-vermilion" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D04A26" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#D04A26" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central glow core */}
          <circle cx="400" cy="400" r="280" fill={isMajor ? 'url(#burst-vermilion)' : 'url(#burst-gold)'} />

          {/* Radiating comic speed lines (48 rays) */}
          {Array.from({ length: 48 }).map((_, i) => {
            const angle = (i * 360) / 48;
            const isLong = i % 2 === 0;
            const isAccent = i % 6 === 0;
            const strokeColor = isAccent ? '#C5A059' : '#EDE8DF';
            const strokeOpacity = isAccent ? 0.35 : isLong ? 0.18 : 0.08;
            const strokeWidth = isAccent ? 2.5 : isLong ? 1.5 : 1;

            return (
              <line
                key={i}
                x1="400"
                y1="400"
                x2={400 + 420 * Math.cos((angle * Math.PI) / 180)}
                y2={400 + 420 * Math.sin((angle * Math.PI) / 180)}
                stroke={strokeColor}
                strokeOpacity={strokeOpacity}
                strokeWidth={strokeWidth}
                strokeDasharray={isLong ? '12 8' : 'none'}
              />
            );
          })}
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING GOLD EMBERS / PARTICLES
      ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {EMBERS.map((ember) => (
          <motion.div
            key={ember.id}
            initial={{ opacity: 0, y: 30, scale: 0.5 }}
            animate={{
              opacity: [0, 0.9, 0],
              y: [-10, -90],
              scale: [0.5, 1.2, 0.6],
            }}
            transition={{
              duration: ember.duration,
              delay: ember.delay,
              ease: 'easeOut',
            }}
            className="absolute rounded-full bg-[#E2B678] shadow-[0_0_8px_#C5A059]"
            style={{
              left: ember.left,
              top: ember.top,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
            }}
          />
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN IMPACT STAGE (CUBIC-BEZIER SCALE PUNCH + SHAKE)
      ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.35, opacity: 0, rotate: -2 }}
        animate={{
          scale: [0.35, 1.14, 0.97, 1],
          opacity: 1,
          rotate: [-2, 1, -0.5, 0],
          x: isMajor ? [0, -6, 6, -4, 4, -1, 0] : 0,
          y: isMajor ? [0, 4, -4, 2, -2, 0] : 0,
        }}
        transition={{
          duration: 0.52,
          times: [0, 0.55, 0.8, 1],
          ease: [0.175, 0.885, 0.32, 1.275], // Punchy comic overshoot
        }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl"
      >
        {/* Top Comic Stamp: "SOVEREIGN ACT COMPLETE" */}
        <motion.div
          initial={{ scale: 0, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.28, ease: 'easeOut' }}
          className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-sm border-2 border-[#D04A26] bg-[#D04A26]/20 text-[#D04A26] font-mono text-[10px] tracking-[0.26em] uppercase font-bold shadow-[2px_2px_0px_#06090E] -rotate-2"
        >
          <Zap className="w-3.5 h-3.5 fill-[#D04A26]" />
          <span>SOVEREIGN ACT COMPLETE</span>
        </motion.div>

        {/* Primary Punchy Typography */}
        <div className="relative my-2">
          {/* Subtle Drop Shadow Text for Comic Offset */}
          <h1
            aria-hidden="true"
            className="absolute inset-0 font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tighter uppercase select-none text-[#06090E] translate-x-1.5 translate-y-1.5 opacity-90 blur-[0.5px]"
          >
            {primaryText}
          </h1>

          <h1 className="relative font-display font-black text-5xl sm:text-7xl lg:text-8xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#FFFDF9] via-[#EDE8DF] to-[#C5A059] drop-shadow-[0_8px_30px_rgba(197,160,89,0.4)]">
            {primaryText}
          </h1>
        </div>

        {/* Quest Title Subline if provided */}
        {questTitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.3 }}
            className="font-sans text-xs sm:text-sm text-[#C5A059] font-medium tracking-wider uppercase mt-1 mb-6 max-w-md line-clamp-1"
          >
            &ldquo;{questTitle}&rdquo;
          </motion.p>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. TACTILE COMIC BADGES (STAMPED REWARD PILLS)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mt-2">
          {/* XP Pill */}
          <motion.div
            initial={{ scale: 0, rotate: -6 }}
            animate={{ scale: 1, rotate: -2 }}
            transition={{ delay: 0.28, duration: 0.32, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0D1520] border-2 border-[#C5A059] shadow-[3px_3px_0px_#06090E]"
          >
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span className="font-mono text-xs sm:text-sm font-bold text-[#F7F5F0] tracking-wider">
              +{xp} XP
            </span>
          </motion.div>

          {/* Momentum Pill */}
          <motion.div
            initial={{ scale: 0, rotate: 6 }}
            animate={{ scale: 1, rotate: 2 }}
            transition={{ delay: 0.34, duration: 0.32, ease: [0.175, 0.885, 0.32, 1.275] }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0D1520] border-2 border-[#E2B678]/80 shadow-[3px_3px_0px_#06090E]"
          >
            <Flame className="w-4 h-4 text-[#E65100]" />
            <span className="font-mono text-xs sm:text-sm font-bold text-[#E2B678] tracking-wider">
              MOMENTUM +{momentum}
            </span>
          </motion.div>

          {/* Attribute or Marks Pill */}
          {attrKey ? (
            <motion.div
              initial={{ scale: 0, rotate: -4 }}
              animate={{ scale: 1, rotate: -1 }}
              transition={{ delay: 0.4, duration: 0.32, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D1520] border-2 border-[#3A7F58] shadow-[3px_3px_0px_#06090E]"
            >
              <Shield className="w-3.5 h-3.5 text-[#3A7F58]" />
              <span className="font-mono text-xs font-bold text-[#3A7F58] tracking-wider">
                +{attrPoints} {attrKey}
              </span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0, rotate: 4 }}
              animate={{ scale: 1, rotate: 1 }}
              transition={{ delay: 0.4, duration: 0.32, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0D1520] border-2 border-[#1E2B3C] shadow-[3px_3px_0px_#06090E]"
            >
              <Award className="w-3.5 h-3.5 text-[#8B97A6]" />
              <span className="font-mono text-xs font-bold text-[#EDE8DF] tracking-wider">
                +{marks} MARKS
              </span>
            </motion.div>
          )}
        </div>

        {/* Tactile hint to skip */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="font-mono text-[9px] text-[#8B97A6] tracking-widest uppercase mt-8 block"
        >
          Tap or press Space to proceed
        </motion.span>
      </motion.div>
    </div>
  );
}
