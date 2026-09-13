'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Shield, ArrowRight, CheckCircle2, Trophy, Coins } from 'lucide-react';
import { ArcAttributeKey } from '@/lib/game-engine';
import ComicImpactCelebration, { CelebrationIntensity } from './ComicImpactCelebration';

export interface CelebrationPayload {
  questTitle: string;
  attrKey: ArcAttributeKey;
  attrPoints: number;
  momentum: number;
  marks: number;
  xp: number;
  streak: number;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
  oldTitle?: string;
  newTitle?: string;
  milestoneReached?: {
    title: string;
    category: string;
    description: string;
  } | null;
  intensity?: CelebrationIntensity;
}

function useCountUp(endValue: number, duration: number = 750, enabled: boolean = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }
    let frameId: number;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(ease * endValue));

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [endValue, duration, enabled]);

  return count;
}

export default function ArcCelebrationModal({
  data,
  onClose,
  onViewJourney,
}: {
  data: CelebrationPayload;
  onClose: () => void;
  onViewJourney?: () => void;
}) {
  const [stage, setStage] = useState<'punch' | 'rewards' | 'levelup' | 'milestone'>('punch');
  const [fillProgress, setFillProgress] = useState(false);

  const isRewardsActive = stage === 'rewards';
  const displayAttr = useCountUp(data.attrPoints, 750, isRewardsActive);
  const displayMomentum = useCountUp(data.momentum, 750, isRewardsActive);
  const displayMarks = useCountUp(data.marks, 750, isRewardsActive);
  const displayXp = useCountUp(data.xp, 750, isRewardsActive);

  useEffect(() => {
    if (stage === 'rewards') {
      const timer = setTimeout(() => setFillProgress(true), 150);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handleNext = () => {
    if (stage === 'rewards') {
      if (data.leveledUp) {
        setStage('levelup');
      } else if (data.milestoneReached) {
        setStage('milestone');
      } else {
        onClose();
      }
    } else if (stage === 'levelup') {
      if (data.milestoneReached) {
        setStage('milestone');
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const computedIntensity: CelebrationIntensity =
    data.intensity ||
    (data.milestoneReached
      ? 'MILESTONE'
      : data.leveledUp
      ? 'MAJOR'
      : data.xp >= 40 || data.attrPoints >= 20
      ? 'DEMANDING'
      : data.xp >= 20
      ? 'STANDARD'
      : 'LIGHT');

  if (stage === 'punch') {
    return (
      <ComicImpactCelebration
        intensity={computedIntensity}
        questTitle={data.questTitle}
        xp={data.xp}
        momentum={data.momentum}
        marks={data.marks}
        attrKey={data.attrKey}
        attrPoints={data.attrPoints}
        onComplete={() => setStage('rewards')}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          STAGE 1: TACTILE REWARDS MATRIX (NUMBERS COUNT UP)
      ───────────────────────────────────────────────────────────── */}
      {stage === 'rewards' && (
        <div className="relative max-w-lg w-full rounded-xl border border-[#C5A059]/80 bg-gradient-to-b from-[#0F1622] via-[#0A0F16] to-[#06090E] p-8 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.95)] overflow-hidden text-center">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059] mb-4 shadow-[0_0_24px_rgba(197,160,89,0.4)]">
              <Sparkles className="w-7 h-7" />
            </div>

            <span className="block font-mono text-[10px] tracking-[0.28em] text-[#C5A059] uppercase font-semibold mb-1">
              QUEST FULFILLED · THE ARC ADVANCES
            </span>

            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F2EEE6] tracking-wide uppercase mb-3">
              {data.questTitle}
            </h2>

            <p className="font-sans text-xs text-[#8B97A6] font-light max-w-md mx-auto mb-6">
              Your real-world action has been verified and permanently recorded into the sovereign ledger.
            </p>

            {/* Tactile Counting Rewards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-lg border border-[#1E2B3C] bg-[#080C12]/90">
                <span className="block font-mono text-[8px] text-[#6B7784] uppercase tracking-wider mb-1">
                  ATTRIBUTE
                </span>
                <span className="font-display font-semibold text-xl text-[#EDE8DF] tabular-nums">
                  +{displayAttr}
                </span>
                <span className="block font-mono text-[9px] text-[#C5A059] mt-0.5">
                  {data.attrKey}
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-[#1E2B3C] bg-[#080C12]/90">
                <span className="block font-mono text-[8px] text-[#6B7784] uppercase tracking-wider mb-1">
                  MOMENTUM
                </span>
                <span className="font-display font-semibold text-xl text-[#C5A059] tabular-nums">
                  +{displayMomentum}
                </span>
                <span className="block font-mono text-[9px] text-[#6B7784] mt-0.5">
                  VELOCITY
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-[#1E2B3C] bg-[#080C12]/90">
                <span className="block font-mono text-[8px] text-[#6B7784] uppercase tracking-wider mb-1">
                  MARKS
                </span>
                <span className="font-display font-semibold text-xl text-[#EDE8DF] tabular-nums">
                  +{displayMarks}
                </span>
                <span className="block font-mono text-[9px] text-[#C5A059] mt-0.5">
                  ARMORY
                </span>
              </div>

              <div className="p-3.5 rounded-lg border border-[#1E2B3C] bg-[#080C12]/90">
                <span className="block font-mono text-[8px] text-[#6B7784] uppercase tracking-wider mb-1">
                  TOTAL XP
                </span>
                <span className="font-display font-semibold text-xl text-[#3A7F58] tabular-nums">
                  +{displayXp}
                </span>
                <span className="block font-mono text-[9px] text-[#6B7784] mt-0.5">
                  PROGRESSION
                </span>
              </div>
            </div>

            {/* Smooth Level Progress Line */}
            <div className="p-4 rounded-lg border border-[#1E2B3C] bg-[#080C12]/90 mb-6 text-left">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-[#EDE8DF]">ARC LEVEL PROGRESSION</span>
                <span className="text-[#C5A059]">+{data.xp} XP GAINED</span>
              </div>
              <div className="w-full h-2 bg-[#141C26] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8C6D38] via-[#C5A059] to-[#E5C985] transition-all duration-1000 shadow-[0_0_12px_rgba(197,160,89,0.5)]"
                  style={{ width: fillProgress ? '78%' : '40%' }}
                />
              </div>
            </div>

            {/* Streak Indicator */}
            <div className="p-3.5 rounded-lg border border-[#1A2534] bg-[#090D13] flex items-center justify-between mb-8 text-xs font-mono">
              <div className="flex items-center gap-2 text-[#EDE8DF]">
                <Flame className="w-4 h-4 text-[#E65100]" />
                <span>STREAK: {data.streak} DAYS</span>
              </div>
              <span className="text-[#3A7F58] font-semibold">● UNBROKEN</span>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-4 px-6 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-sans text-xs tracking-[0.22em] uppercase font-semibold transition-all rounded shadow-[0_4px_25px_rgba(197,160,89,0.35)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{data.leveledUp ? 'Ascend Level →' : data.milestoneReached ? 'Inspect Milestone →' : 'Continue Your Arc →'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 2: DEDICATED LEVEL UP TRANSITION (LEVEL 07 → LEVEL 08)
      ───────────────────────────────────────────────────────────── */}
      {stage === 'levelup' && (
        <div className="relative max-w-lg w-full rounded-xl border border-[#C5A059] bg-[#0A0F16] p-8 sm:p-10 text-center shadow-[0_0_80px_rgba(197,160,89,0.3)] animate-in fade-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059] mb-5 shadow-[0_0_30px_rgba(197,160,89,0.4)]">
            <Sparkles className="w-8 h-8" />
          </div>

          <span className="block font-mono text-[10px] tracking-[0.3em] text-[#C5A059] uppercase font-semibold mb-2">
            ARC ASCENSION · LEVEL ADVANCEMENT
          </span>

          <div className="flex items-center justify-center gap-4 text-3xl sm:text-5xl font-display font-bold text-[#F2EEE6] uppercase tracking-tight my-4">
            <span className="text-[#8B97A6]">LEVEL {String(data.oldLevel || 7).padStart(2, '0')}</span>
            <span className="text-[#C5A059] text-2xl sm:text-3xl">→</span>
            <span className="text-[#F2EEE6]">LEVEL {String(data.newLevel || 8).padStart(2, '0')}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="font-mono text-xs text-[#C5A059] uppercase tracking-widest font-semibold">
              NEW TITLE UNLOCKED · {data.newTitle || 'MOMENTUM'}
            </span>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#A6B2C0] font-light leading-relaxed max-w-md mx-auto mb-8">
            Compounding discipline takes hold. Your daily recurrence has established an elevated baseline across the sovereign capabilities.
          </p>

          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 px-6 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-sans text-xs tracking-[0.22em] uppercase font-semibold transition-all rounded shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{data.milestoneReached ? 'Inspect Milestone →' : 'Continue Your Arc →'}</span>
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 3: MILESTONE REACHED DISCOVERY
      ───────────────────────────────────────────────────────────── */}
      {stage === 'milestone' && data.milestoneReached && (
        <div className="relative max-w-lg w-full rounded-xl border border-[#C5A059] bg-[#0A0F16] p-8 sm:p-10 text-center shadow-[0_0_80px_rgba(197,160,89,0.3)] animate-in fade-in zoom-in-95 duration-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059] mb-5 shadow-[0_0_30px_rgba(197,160,89,0.4)]">
            <Trophy className="w-8 h-8" />
          </div>

          <span className="block font-mono text-[10px] tracking-[0.3em] text-[#C5A059] uppercase font-semibold mb-2">
            PERMANENT BASELINE ESTABLISHED
          </span>

          <h3 className="font-display font-bold text-3xl sm:text-4xl text-[#F2EEE6] uppercase tracking-wide mb-2">
            {data.milestoneReached.title}
          </h3>

          <p className="font-sans text-xs sm:text-sm text-[#A6B2C0] font-light leading-relaxed max-w-md mx-auto mb-6">
            {data.milestoneReached.description}
          </p>

          <div className="p-3 bg-[#080C12] border border-[#1E2938] rounded font-mono text-xs text-[#C5A059] mb-8">
            CATEGORY: {data.milestoneReached.category} · PERMANENTLY LOCKED INTO CHRONICLE
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {onViewJourney && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewJourney();
                }}
                className="flex-1 py-3.5 px-5 rounded border border-[#C5A059]/60 hover:border-[#C5A059] text-xs font-mono text-[#C5A059] uppercase tracking-wider transition-colors cursor-pointer"
              >
                View in Journey →
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-5 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold transition-all rounded shadow-md cursor-pointer"
            >
              Continue &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
