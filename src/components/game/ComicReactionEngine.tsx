'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Sparkles,
  Shield,
  Award,
  AlertTriangle,
  ArrowRight,
  Flame,
  Coins,
  X,
} from 'lucide-react';
import { ArcAttributeKey } from '@/lib/game-engine';
import {
  playQuestAccept,
  playQuestComplete,
  playXpGain,
  playAttributeGain,
  playBadgeUnlock,
  playLevelUp,
  playMilestone,
  playActionRejected,
  playRewardEquipped,
} from '@/lib/sound-effects';

export type ComicReactionType =
  | 'QUEST_ACCEPT'
  | 'QUEST_COMPLETE'
  | 'BADGE_UNLOCK'
  | 'LEVEL_UP'
  | 'MILESTONE'
  | 'ACTION_REJECTED';

export interface UnlockedBadgeData {
  name: string;
  type: string;
  image: string;
  description: string;
}

export interface MilestoneData {
  title: string;
  category: string;
  description: string;
}

export interface ComicReactionPayload {
  type: ComicReactionType;
  questTitle?: string;
  dialogue?: string;
  attrKey?: ArcAttributeKey;
  attrPoints?: number;
  xp?: number;
  momentum?: number;
  marks?: number;
  oldLevel?: number;
  newLevel?: number;
  milestone?: MilestoneData | null;
  badge?: UnlockedBadgeData | null;
  rejectionReason?: string;
}

interface ComicReactionEngineProps {
  payload: ComicReactionPayload | null;
  onClose: () => void;
  onEquipBadge?: (badgeName: string) => void;
}

function useCountUp(endValue: number, durationMs: number = 700, enabled: boolean = true) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!enabled || endValue <= 0) {
      setVal(endValue <= 0 ? 0 : 0);
      return;
    }
    let frameId: number;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setVal(Math.round(ease * endValue));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [endValue, durationMs, enabled]);

  return val;
}

export default function ComicReactionEngine({
  payload,
  onClose,
  onEquipBadge,
}: ComicReactionEngineProps) {
  const [step, setStep] = useState<'INITIAL' | 'BADGE' | 'LEVEL' | 'MILESTONE'>('INITIAL');
  const [hasEquipped, setHasEquipped] = useState(false);

  // Sync internal step when new payload arrives
  useEffect(() => {
    if (!payload) {
      setStep('INITIAL');
      setHasEquipped(false);
      return;
    }

    setStep('INITIAL');
    setHasEquipped(false);

    // Audio cues based on primary type
    if (payload.type === 'QUEST_ACCEPT') {
      playQuestAccept();
      // Auto-dismiss fast (<700ms)
      const timer = setTimeout(() => {
        onClose();
      }, 650);
      return () => clearTimeout(timer);
    } else if (payload.type === 'QUEST_COMPLETE') {
      playQuestComplete();
    } else if (payload.type === 'BADGE_UNLOCK') {
      playBadgeUnlock();
    } else if (payload.type === 'LEVEL_UP') {
      playLevelUp();
    } else if (payload.type === 'MILESTONE') {
      playMilestone();
    } else if (payload.type === 'ACTION_REJECTED') {
      playActionRejected();
    }
  }, [payload, onClose]);

  if (!payload) return null;

  // Sound effects for reward counts
  const countXp = useCountUp(payload.xp || 0, 600, payload.type === 'QUEST_COMPLETE');
  const countMomentum = useCountUp(payload.momentum || 0, 600, payload.type === 'QUEST_COMPLETE');
  const countMarks = useCountUp(payload.marks || 0, 600, payload.type === 'QUEST_COMPLETE');
  const countAttr = useCountUp(payload.attrPoints || 0, 600, payload.type === 'QUEST_COMPLETE');

  // Cascade handler from Complete -> Badge -> Level -> Milestone -> Done
  const handleNextInCascade = () => {
    if (step === 'INITIAL' && payload.type === 'QUEST_COMPLETE') {
      if (payload.badge) {
        setStep('BADGE');
        playBadgeUnlock();
      } else if (payload.newLevel && payload.oldLevel && payload.newLevel > payload.oldLevel) {
        setStep('LEVEL');
        playLevelUp();
      } else if (payload.milestone) {
        setStep('MILESTONE');
        playMilestone();
      } else {
        onClose();
      }
    } else if (step === 'BADGE') {
      if (payload.newLevel && payload.oldLevel && payload.newLevel > payload.oldLevel) {
        setStep('LEVEL');
        playLevelUp();
      } else if (payload.milestone) {
        setStep('MILESTONE');
        playMilestone();
      } else {
        onClose();
      }
    } else if (step === 'LEVEL') {
      if (payload.milestone) {
        setStep('MILESTONE');
        playMilestone();
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        {/* Subtle graphic novel dark dot matrix & restrained vignette */}
        <div
          className="fixed inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(rgba(197, 160, 89, 0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* ─────────────────────────────────────────────────────────────
            1. QUEST ACCEPT FLASH (<700ms)
        ───────────────────────────────────────────────────────────── */}
        {payload.type === 'QUEST_ACCEPT' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-sm w-full border-2 border-[#C5A059] bg-[#0A0E17] p-6 text-center shadow-[0_0_40px_rgba(197,160,89,0.3)]"
          >
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#C5A059] font-bold mb-1">
              QUEST ACCEPTED
            </div>
            <div className="font-display font-black text-2xl uppercase tracking-wider text-[#F7F5F0]">
              {payload.dialogue || 'THEN MOVE.'}
            </div>
            <div className="mt-2 text-xs font-mono text-[#8391A1] uppercase tracking-widest">
              ONE MOVE AT A TIME.
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            2. ACTION REJECTED (Anti-Cheat / Invalid State)
        ───────────────────────────────────────────────────────────── */}
        {payload.type === 'ACTION_REJECTED' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative max-w-md w-full border border-[#8F1D1D]/90 bg-gradient-to-b from-[#14080A] via-[#0C0607] to-[#060304] p-8 text-center shadow-[0_20px_80px_rgba(143,29,29,0.4)] rounded-xl"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-[#8F1D1D] bg-[#8F1D1D]/15 flex items-center justify-center text-[#E05252]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <span className="font-mono text-[10px] tracking-[0.3em] text-[#E05252] font-bold uppercase block mb-1">
              ACTION REJECTED
            </span>

            <h3 className="font-display font-bold text-2xl text-[#F7F5F0] tracking-wide uppercase mb-3">
              THE ARC DOES NOT BEND.
            </h3>

            <p className="font-sans text-xs text-[#A89A9A] leading-relaxed mb-6">
              {payload.rejectionReason ||
                "THAT MOVE DOESN'T COUNT · UNVERIFIED ACTION · NO PROGRESSION AWARDED."}
            </p>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#1A0C0E] hover:bg-[#2A1215] border border-[#8F1D1D]/80 text-[#F7F5F0] font-mono text-xs font-semibold tracking-widest uppercase transition-all duration-200"
            >
              RETURN TO CHRONICLE
            </button>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            3. QUEST COMPLETE CASCADE (World Reacts -> Rewards Count)
        ───────────────────────────────────────────────────────────── */}
        {payload.type === 'QUEST_COMPLETE' && step === 'INITIAL' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-lg w-full border border-[#C5A059] bg-gradient-to-b from-[#0F1622] via-[#0A0F16] to-[#06090E] p-8 sm:p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.95)] rounded-xl overflow-hidden"
          >
            {/* Background Environmental Silhouette Treatment */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <Image
                src="/images/hero_arc_cinematic.jpg"
                alt="Environmental reaction"
                fill
                className="object-cover object-center grayscale contrast-150"
              />
            </div>

            <div className="relative z-10">
              {/* Checkmark crest */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059] mb-4 shadow-[0_0_24px_rgba(197,160,89,0.3)]">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>

              {/* World Reaction Line */}
              <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#C5A059] font-bold mb-1">
                YOU DID IT.
              </div>

              <h2 className="font-display font-black text-3xl sm:text-4xl text-[#F7F5F0] tracking-wider uppercase mb-2">
                QUEST COMPLETE
              </h2>

              <div className="inline-block px-3 py-1 bg-[#101824] border border-[#223348] text-xs font-mono text-[#D6C4A5] uppercase tracking-wider mb-6">
                ✓ {payload.questTitle || 'Sovereign Directive'}
              </div>

              {/* Deterministic Counting Rewards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <div className="p-3 bg-[#080C12]/90 border border-[#1E2B3C] rounded-lg">
                  <span className="block font-mono text-[9px] text-[#718090] uppercase tracking-wider mb-0.5">
                    XP EARNED
                  </span>
                  <span className="font-display font-bold text-xl text-[#F7F5F0]">
                    +{countXp}
                  </span>
                </div>

                <div className="p-3 bg-[#080C12]/90 border border-[#1E2B3C] rounded-lg">
                  <span className="block font-mono text-[9px] text-[#718090] uppercase tracking-wider mb-0.5">
                    MOMENTUM
                  </span>
                  <span className="font-display font-bold text-xl text-[#E05252]">
                    +{countMomentum}
                  </span>
                </div>

                <div className="p-3 bg-[#080C12]/90 border border-[#1E2B3C] rounded-lg">
                  <span className="block font-mono text-[9px] text-[#718090] uppercase tracking-wider mb-0.5">
                    MARKS
                  </span>
                  <span className="font-display font-bold text-xl text-[#C5A059]">
                    +{countMarks}
                  </span>
                </div>

                <div className="p-3 bg-[#080C12]/90 border border-[#1E2B3C] rounded-lg">
                  <span className="block font-mono text-[9px] text-[#718090] uppercase tracking-wider mb-0.5">
                    {payload.attrKey || 'CRAFT'}
                  </span>
                  <span className="font-display font-bold text-xl text-[#82AAFF]">
                    +{countAttr || countXp}
                  </span>
                </div>
              </div>

              <button
                onClick={handleNextInCascade}
                className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#E2C37D] to-[#C5A059] text-[#06090E] font-mono text-xs font-black tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(197,160,89,0.3)]"
              >
                <span>CONTINUE THE ARC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. RELIC / BADGE UNLOCK REVEAL
        ───────────────────────────────────────────────────────────── */}
        {(payload.type === 'BADGE_UNLOCK' || step === 'BADGE') && payload.badge && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-md w-full border-2 border-[#C5A059] bg-[#0A0F17] p-8 text-center rounded-xl shadow-[0_0_60px_rgba(197,160,89,0.4)] overflow-hidden"
          >
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#C5A059] font-bold mb-2">
              RELIC / INSIGNIA REVEAL
            </div>

            {/* Badge Artwork Scaling In */}
            <motion.div
              initial={{ scale: 0.6, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 120 }}
              className="relative w-36 h-36 mx-auto mb-5 rounded-xl border-2 border-[#C5A059] p-1.5 bg-[#06090E] shadow-[0_0_30px_rgba(197,160,89,0.5)]"
            >
              <Image
                src={payload.badge.image || '/images/armory/badge_celestial_compass.jpg'}
                alt={payload.badge.name}
                fill
                className="object-cover rounded-lg"
              />
            </motion.div>

            <h3 className="font-display font-black text-2xl text-[#F7F5F0] tracking-wider uppercase mb-1">
              {payload.badge.name}
            </h3>

            <div className="font-mono text-xs text-[#C5A059] uppercase tracking-widest mb-3">
              &quot;EARNED.&quot;
            </div>

            <p className="font-sans text-xs text-[#8B98A6] leading-relaxed mb-6 max-w-sm mx-auto">
              {payload.badge.description}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setHasEquipped(true);
                  playRewardEquipped();
                  if (onEquipBadge && payload.badge) {
                    onEquipBadge(payload.badge.name);
                  }
                }}
                disabled={hasEquipped}
                className={`flex-1 py-3 font-mono text-xs font-bold tracking-widest uppercase transition-all ${
                  hasEquipped
                    ? 'bg-[#182332] text-[#8696A6] border border-[#223348]'
                    : 'bg-[#C5A059] hover:bg-[#D4B06A] text-[#06090E] font-black'
                }`}
              >
                {hasEquipped ? 'EQUIPPED ✓' : 'EQUIP'}
              </button>

              <button
                onClick={handleNextInCascade}
                className="flex-1 py-3 bg-[#101824] hover:bg-[#162232] border border-[#223348] text-[#F7F5F0] font-mono text-xs font-semibold tracking-widest uppercase transition-all"
              >
                CONTINUE
              </button>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            5. LEVEL UP MOMENT
        ───────────────────────────────────────────────────────────── */}
        {(payload.type === 'LEVEL_UP' || step === 'LEVEL') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative max-w-md w-full border-2 border-[#C5A059] bg-[#0A0E17] p-8 sm:p-10 text-center rounded-xl shadow-[0_0_80px_rgba(197,160,89,0.45)]"
          >
            <div className="font-mono text-xs tracking-[0.3em] uppercase text-[#C5A059] font-bold mb-2">
              YOU&apos;RE NOT WHERE YOU STARTED.
            </div>

            <div className="inline-block px-4 py-1.5 bg-[#C5A059]/20 border border-[#C5A059] text-xs font-mono text-[#F7F5F0] tracking-[0.25em] uppercase font-bold mb-4">
              LEVEL UP
            </div>

            <h2 className="font-display font-black text-4xl sm:text-5xl text-[#F7F5F0] tracking-wider uppercase mb-2">
              LEVEL 0{payload.newLevel || 8}
            </h2>

            <div className="font-mono text-xs text-[#E05252] font-semibold tracking-[0.3em] uppercase mb-6">
              MOMENTUM SOLIDIFIED
            </div>

            <button
              onClick={handleNextInCascade}
              className="w-full py-3.5 bg-[#C5A059] hover:bg-[#D4B06A] text-[#06090E] font-mono text-xs font-black tracking-widest uppercase transition-all"
            >
              CONTINUE
            </button>
          </motion.div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            6. MILESTONE MOMENT
        ───────────────────────────────────────────────────────────── */}
        {(payload.type === 'MILESTONE' || step === 'MILESTONE') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative max-w-md w-full border border-[#C5A059] bg-[#0A0F17] p-8 text-center rounded-xl shadow-[0_0_80px_rgba(197,160,89,0.5)] overflow-hidden"
          >
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <Image
                src="/images/hero_arc_vista.jpg"
                alt="Milestone vista"
                fill
                className="object-cover object-center grayscale contrast-150"
              />
            </div>

            <div className="relative z-10">
              <div className="font-mono text-xs tracking-[0.3em] uppercase text-[#C5A059] font-bold mb-2">
                YOU KEPT MOVING.
              </div>

              <div className="inline-block px-3.5 py-1 bg-[#182332] border border-[#26374D] text-[10px] font-mono text-[#8B98A6] uppercase tracking-widest mb-3">
                MILESTONE
              </div>

              <h2 className="font-display font-black text-3xl text-[#F7F5F0] tracking-wider uppercase mb-2">
                {payload.milestone?.title || '10 QUESTS COMPLETE'}
              </h2>

              <p className="font-sans text-xs text-[#9EACB8] leading-relaxed mb-6">
                {payload.milestone?.description || 'The sovereign standard is established in reality.'}
              </p>

              <div className="font-mono text-xs text-[#C5A059] font-bold tracking-[0.25em] uppercase mb-6">
                THE ARC CONTINUES.
              </div>

              <button
                onClick={handleNextInCascade}
                className="w-full py-3.5 bg-[#C5A059] hover:bg-[#D4B06A] text-[#06090E] font-mono text-xs font-black tracking-widest uppercase transition-all"
              >
                RESUME JOURNEY
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
