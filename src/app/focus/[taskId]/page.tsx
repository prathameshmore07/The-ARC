'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

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
  const [taskTitle, setTaskTitle] = useState('Inscribing Focus Session');
  const [elapsed, setElapsed] = useState(0);
  const [heartbeats, setHeartbeats] = useState(0);
  const [ending, setEnding] = useState(false);
  const [runComplete, setRunComplete] = useState(false);

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

        // Fetch task info
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

  const handleEndSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);

    try {
      if (sessionId) {
        // End session on server
        await fetch('/api/sessions/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }

      // Complete the task with the verified session
      const completeRes = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusSessionId: sessionId }),
      });

      const result = await completeRes.json();
      setRunComplete(true);

      // Transition after brief "Run complete" display
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
    <div className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex flex-col justify-between p-8 sm:p-16 select-none">
      {/* Minimal Top Indicator */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between text-xs text-[var(--page-bone-dim)]/60">
        <span className="font-serif uppercase tracking-widest text-[var(--brass)] font-semibold">
          Focus Mode
        </span>
        <span>{heartbeats} Banked</span>
      </div>

      {/* Main Focus Centerpiece (Section 3.9) */}
      <div className="w-full max-w-xl mx-auto text-center my-auto">
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[var(--page-bone)] mb-8 max-w-md mx-auto truncate">
          {taskTitle}
        </h1>

        {/* Large Fraunces Timer Numeral */}
        <div className="font-serif font-bold text-7xl sm:text-9xl text-[var(--page-bone)] tracking-tight mb-8">
          {formatTime(elapsed)}
        </div>

        {/* Thin Progress Line */}
        <div className="w-48 sm:w-64 h-1 bg-[var(--page-bone-dim)]/20 rounded-full mx-auto overflow-hidden mb-6">
          <motion.div
            className="h-full bg-[var(--brass)]"
            animate={{ width: `${(elapsed % 60) * (100 / 60)}%` }}
            transition={{ ease: 'linear', duration: 1 }}
          />
        </div>

        {/* Re-framed Muted Copy (Section 3.9) */}
        <p className="text-xs text-[var(--page-bone-dim)]/70 font-medium mb-10">
          Stay active to bank rewards — server-timed session
        </p>

        {/* Action Button */}
        {runComplete ? (
          <span className="font-serif font-bold text-xl text-[var(--brass)] animate-pulse">
            Run complete
          </span>
        ) : (
          <button
            onClick={handleEndSession}
            disabled={ending}
            className="px-8 py-3.5 rounded-xl border border-[var(--page-bone-dim)]/30 hover:border-[var(--brass)] text-[var(--page-bone)] font-serif font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {ending ? 'Banking session...' : 'End Session'}
          </button>
        )}
      </div>

      {/* Minimal Bottom Anchor */}
      <div className="w-full max-w-xl mx-auto text-center text-[11px] text-[var(--page-bone-dim)]/40">
        Leaving this screen will finalize the current session.
      </div>
    </div>
  );
}
