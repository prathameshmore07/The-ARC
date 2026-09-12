'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Skull, Shield, Zap, Sparkles, Check, ArrowRight } from 'lucide-react';
import { getShadowOriginStory } from '@/lib/game-engine';

interface ShadowEntityData {
  id: string;
  hp: number;
  baselineWeeklyRate: number;
  stealRate: number;
  sealProgress: number;
  stepsNeeded: number;
}

interface AttributeData {
  id: string;
  name: string;
  level: number;
  streak: number;
  lastActivityAt: string;
  shadow: ShadowEntityData | null;
}

export default function ConfrontShadowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: attributeId } = use(params);

  const [attribute, setAttribute] = useState<AttributeData | null>(null);
  const [firstTaskId, setFirstTaskId] = useState<string | null>(null);
  const [firstTaskTitle, setFirstTaskTitle] = useState<string>('Focused Effort');
  const [loading, setLoading] = useState(true);

  // Animation states for Confront sequence (Section 3.8)
  const [isShaking, setIsShaking] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  const [reclaimedAmount, setReclaimedAmount] = useState<number>(40);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        const found = json.attributes?.find((a: any) => a.id === attributeId);
        if (found) {
          setAttribute(found);
          const tasks = json.tasks?.filter((t: any) => t.attributeId === attributeId && t.status !== 'done');
          if (tasks && tasks.length > 0) {
            setFirstTaskId(tasks[0].id);
            setFirstTaskTitle(tasks[0].title);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [attributeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if returning from focus session with seal progress
  useEffect(() => {
    if (searchParams.get('defeated') === 'true') {
      setIsDefeated(true);
      setReclaimedAmount(parseInt(searchParams.get('reclaimed') || '40', 10));
    } else if (searchParams.get('damaged') === 'true') {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 300);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleStartConfrontSession = async () => {
    let taskIdToUse = firstTaskId;

    // If no open task exists for this attribute, forge a default confront quest
    if (!taskIdToUse) {
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Banish ${attribute?.name || 'Shadow'}`,
            attributeId,
          }),
        });
        if (res.ok) {
          const newTask = await res.json();
          taskIdToUse = newTask.id;
        }
      } catch (err) {
        console.error('Failed to forge confront task', err);
      }
    }

    if (taskIdToUse) {
      router.push(`/focus/${taskIdToUse}?confront=true&attrId=${attributeId}`);
    }
  };

  if (loading || !attribute) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const shadow = attribute.shadow;
  const msSinceActivity = Date.now() - new Date(attribute.lastActivityAt).getTime();
  const daysNeglected = Math.max(1, Math.floor(msSinceActivity / (1000 * 60 * 60 * 24)));
  const originStory = shadow
    ? getShadowOriginStory(shadow.baselineWeeklyRate || 0, daysNeglected)
    : 'Spawned from neglected hours.';

  const isFinalSealStep = shadow ? shadow.sealProgress >= shadow.stepsNeeded - 1 : false;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col justify-between p-6 md:p-12 relative overflow-hidden">
      {/* Top Bar */}
      <div className="relative z-20 max-w-4xl w-full mx-auto flex items-center justify-between">
        <Link
          href={`/attribute/${attribute.id}`}
          className="inline-flex items-center gap-2 text-xs text-[var(--text-dim)] hover:text-[var(--text-headline)] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Quest Board</span>
        </Link>
        <span className="font-serif text-xs text-[var(--accent-amber)] font-semibold tracking-wider uppercase">
          Signature Confrontation Arena
        </span>
      </div>

      {/* Main Full-Screen Confront Arena */}
      <div className="relative z-10 max-w-2xl w-full mx-auto my-auto py-8 text-center">
        {/* Ink Stain / Shadow Visual */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-8 flex items-center justify-center">
          <motion.div
            animate={
              isDefeated
                ? { opacity: 0, scale: 0.8, filter: 'blur(16px)' }
                : isShaking
                ? { x: [-4, 4, -4, 4, 0] }
                : { scale: [1, 1.02, 1] }
            }
            transition={
              isDefeated
                ? { duration: 0.9, ease: 'easeOut' }
                : isShaking
                ? { duration: 0.25 }
                : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }
            className="w-full h-full"
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
              <filter id="confront-turb">
                <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="4" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <circle cx="100" cy="100" r="80" fill="var(--accent-brick)" filter="url(#confront-turb)" opacity="0.8" />
            </svg>
          </motion.div>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <Skull className="w-12 h-12 text-red-300 mb-1 drop-shadow" aria-hidden="true" />
            <span className="font-serif font-bold text-xs uppercase tracking-widest text-red-200">
              {shadow ? `HP ${shadow.hp}` : 'Shadow'}
            </span>
          </div>
        </div>

        {/* Shadow Name & Origin Note */}
        <h1 className="font-serif font-bold text-4xl sm:text-5xl text-[var(--text-headline)] mb-3 tracking-tight">
          The Shadow of {attribute.name}
        </h1>

        <p className="text-sm text-[var(--text-dim)] italic font-serif max-w-lg mx-auto mb-8 leading-relaxed">
          &ldquo;{originStory}&rdquo;
        </p>

        {/* Action Card with Seal Progress */}
        <div className="bg-[var(--bg-surface-1)] p-6 sm:p-8 rounded-2xl shadow-rpg-md border border-[var(--border-subtle)] text-left mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            <div>
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-[var(--accent-amber)] block mb-1">
                Confrontation Objective
              </span>
              <h3 className="font-serif font-bold text-xl text-[var(--text-headline)]">{firstTaskTitle}</h3>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-[var(--text-faint)] block">Banishment Power</span>
              <span className="font-serif font-bold text-sm text-[var(--accent-amber)]">
                +1 Seal Notch · HP Depletion
              </span>
            </div>
          </div>

          {/* Seal Steps Row */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-dim)]">Banishment Seal:</span>
              <div className="flex items-center gap-2">
                {Array.from({ length: shadow?.stepsNeeded || 3 }).map((_, idx) => {
                  const isFilled = shadow ? idx < shadow.sealProgress : false;
                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isFilled
                          ? 'bg-[var(--accent-forest)] border-[var(--accent-forest)] text-white shadow-[0_0_8px_rgba(58,127,88,0.7)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-2)]'
                      }`}
                    >
                      {isFilled && <Check className="w-3 h-3" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-[var(--accent-amber)]">
              {shadow ? `${shadow.sealProgress}/${shadow.stepsNeeded}` : '0/3'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {!isDefeated ? (
          <button
            onClick={handleStartConfrontSession}
            className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[var(--accent-slate)] hover:bg-slate-500 text-white font-serif font-bold text-base transition-all shadow-rpg-md hover:shadow-rpg-glow active:scale-98 cursor-pointer"
          >
            Enter Focus Arena
          </button>
        ) : (
          /* Defeat Sequence */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-2xl bg-[var(--bg-surface-1)] shadow-rpg-md border border-[var(--accent-forest)]"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--accent-forest)] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>

            <h2 className="font-serif font-bold text-2xl text-[var(--text-headline)] mb-1">
              Shadow defeated. Potential reclaimed.
            </h2>

            <p className="text-base font-serif font-bold text-emerald-400 mb-2">
              +{reclaimedAmount} XP Restored to {attribute.name}
            </p>

            <p className="text-xs text-[var(--text-dim)] mb-6 max-w-md mx-auto">
              The shadow has been banished from your chronicle. Permanent &ldquo;Scar of {attribute.name}&rdquo; badge awarded to your Armory. +10% Resolve Boost active for 48 hours.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[var(--accent-amber)] hover:bg-amber-300 text-[var(--bg-base)] font-serif font-bold text-sm shadow transition-colors"
            >
              <span>Return to Chronicle</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}
      </div>

      <div className="relative z-10 max-w-4xl w-full mx-auto text-center text-xs text-[var(--text-faint)]">
        Complete verified focus sessions to strike down the shadow and break the seal.
      </div>
    </div>
  );
}
