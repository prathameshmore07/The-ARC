'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Skull, ShieldAlert, Sparkles, Check, Flame } from 'lucide-react';

export default function FocusModePage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { taskId } = use(params);

  const isConfront = searchParams.get('confront') === 'true';
  const confrontAttrId = searchParams.get('attrId');

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('Deep Work Objective');
  const [elapsed, setElapsed] = useState(0);
  const [heartbeats, setHeartbeats] = useState(0);
  const [ending, setEnding] = useState(false);
  const [runComplete, setRunComplete] = useState(false);

  // Boss Battle Stats
  const targetDuration = 1500; // 25 min standard boss encounter
  const [bonusStrikes, setBonusStrikes] = useState(0);
  const [floatingDamage, setFloatingDamage] = useState<{ id: number; dmg: number } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Initialize server-timed session
  useEffect(() => {
    let mounted = true;
    async function startSession() {
      try {
        const res = await fetch('/api/sessions/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        });
        if (res.ok && mounted) {
          const data = await res.json();
          setSessionId(data.sessionId);
        }

        const dashRes = await fetch('/api/dashboard');
        if (dashRes.ok && mounted) {
          const dashData = await dashRes.json();
          const found = dashData.tasks?.find((t: any) => t.id === taskId);
          if (found) setTaskTitle(found.title);
        }
      } catch (err) {
        console.error('Failed to initiate focus session', err);
      }
    }
    startSession();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  // Interval timer and 30s heartbeats
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next % 30 === 0) {
          fetch('/api/sessions/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
            .then((res) => {
              if (res.ok) setHeartbeats((h) => h + 1);
            })
            .catch((err) => console.error('Heartbeat check failed', err));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Calculate Boss HP (100% down to 0%)
  const timeProgressPercent = Math.min(100, Math.round((elapsed / targetDuration) * 100));
  const strikeBonusPercent = bonusStrikes * 5;
  const currentBossHpPercent = Math.max(0, 100 - (timeProgressPercent + strikeBonusPercent));

  // Phase Determination: 75% -> Doubt, 50% -> Distraction, 25% -> Fatigue
  let currentPhase = 'Phase I: Doubt';
  if (currentBossHpPercent <= 25) {
    currentPhase = 'Phase III: Fatigue (Weakened)';
  } else if (currentBossHpPercent <= 50) {
    currentPhase = 'Phase II: Distraction';
  }

  // Strike Action (log micro-task damage tick)
  const handleStrike = () => {
    const dmg = 15;
    setBonusStrikes((prev) => prev + 1);
    setFloatingDamage({ id: Date.now(), dmg });
    setIsShaking(true);

    setTimeout(() => {
      setIsShaking(false);
    }, 400);

    setTimeout(() => {
      setFloatingDamage(null);
    }, 1000);
  };

  const handleEndSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);

    try {
      if (sessionId) {
        await fetch('/api/sessions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }

      const completeRes = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusSessionId: sessionId }),
      });

      const result = await completeRes.json();
      setRunComplete(true);

      setTimeout(() => {
        if (isConfront && confrontAttrId) {
          if (result.shadowDefeated) {
            router.push(`/attribute/${confrontAttrId}/confront?defeated=true&reclaimed=${result.reclaimed || 40}`);
          } else {
            router.push(`/attribute/${confrontAttrId}/confront?damaged=true`);
          }
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    }
  }, [ending, sessionId, taskId, isConfront, confrontAttrId, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col justify-between p-6 sm:p-12 select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-red-950/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top HUD: Boss Title & Banked Heartbeats */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between text-xs border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <Skull className="w-4 h-4 text-red-400" />
          <span className="font-serif uppercase tracking-widest text-[var(--text-headline)] font-bold">
            Boss Encounter: Shadow of Inertia
          </span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-dim)]">
          <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          <span>{heartbeats * 30}s Verified Grind</span>
        </div>
      </div>

      {/* Central Boss Battle HUD */}
      <div className={`w-full max-w-2xl mx-auto text-center my-auto transition-transform ${isShaking ? 'animate-boss-stagger' : ''}`}>
        {/* Phase Banner */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface-1)] border border-red-500/30 text-xs font-serif font-bold text-red-300 mb-6 shadow-rpg-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>{currentPhase}</span>
        </div>

        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[var(--text-headline)] mb-4 max-w-lg mx-auto truncate">
          {taskTitle}
        </h1>

        {/* Central Boss HP Bar */}
        <div className="relative max-w-md mx-auto mb-8">
          {/* Floating Damage Tick */}
          {floatingDamage && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 animate-float-up text-sm font-serif font-extrabold text-red-400 bg-black/80 px-2.5 py-0.5 rounded border border-red-500/40">
              -{floatingDamage.dmg} Boss HP
            </div>
          )}

          <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
            <span className="text-red-400 font-serif">Shadow Resilience</span>
            <span className="text-[var(--text-dim)]">{currentBossHpPercent}% HP</span>
          </div>

          <div className="h-4 bg-[#1F2937] rounded-full overflow-hidden p-0.5 border border-red-900/50 shadow-rpg-sm">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-600 to-emerald-500 transition-all duration-300"
              style={{ width: `${currentBossHpPercent}%` }}
            />
          </div>
        </div>

        {/* Large Timer Numeral */}
        <div className="font-serif font-bold text-7xl sm:text-8xl text-[var(--text-headline)] tracking-tight mb-8">
          {formatTime(elapsed)}
        </div>

        {/* Tactical Controls: Strike Button + End Session */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStrike}
            disabled={ending || currentBossHpPercent <= 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-brick)] hover:bg-red-700 text-white font-serif font-bold text-sm shadow-rpg-sm hover:shadow-rpg-glow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Swords className="w-4 h-4" />
            <span>Strike (Log Micro-Progress)</span>
          </button>

          {runComplete ? (
            <span className="font-serif font-bold text-xl text-[var(--accent-amber)] animate-pulse">
              Shadow Banished!
            </span>
          ) : (
            <button
              onClick={handleEndSession}
              disabled={ending}
              className="px-6 py-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--accent-amber)] bg-[var(--bg-surface-1)] hover:bg-[var(--bg-surface-2)] text-[var(--text-headline)] font-serif font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {ending ? 'Securing Spoils...' : 'Banish & Bank XP'}
            </button>
          )}
        </div>
      </div>

      {/* Minimal Bottom Anchor */}
      <div className="w-full max-w-2xl mx-auto text-center text-xs text-[var(--text-faint)] border-t border-[var(--border-subtle)] pt-4">
        Server-timed session: navigation is minimized to sustain deep cognitive flow.
      </div>
    </div>
  );
}
