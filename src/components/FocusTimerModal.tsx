"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function FocusTimerModal({
  taskId,
  taskTitle,
  onComplete,
  onClose,
}: {
  taskId: string;
  taskTitle: string;
  onComplete: (sessionId: string) => void;
  onClose: () => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [heartbeats, setHeartbeats] = useState(0);

  // Initialize session
  useEffect(() => {
    let mounted = true;
    const startSession = async () => {
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
      } catch (err) {
        console.error('Failed to start session', err);
      }
    };
    startSession();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  // Timer & Heartbeat interval (every 30s)
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
            .catch((err) => console.error('Heartbeat failed', err));
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const endSession = useCallback(async () => {
    if (!sessionId) {
      onClose();
      return;
    }
    try {
      await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      onComplete(sessionId);
    } catch (err) {
      console.error(err);
      onClose();
    }
  }, [sessionId, onComplete, onClose]);

  // Keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (window.confirm('Abandon focus session? Unbanked time will be lost.')) onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        endSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endSession, onClose]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2333]/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center max-w-md w-full p-8 rounded-2xl bg-[#E7E1D3] text-[#23324A] parchment-shadow border border-[#A87C3F]/50 text-center"
      >
        <span className="text-xs font-serif font-bold uppercase tracking-widest text-[#A87C3F] mb-1">
          Chronometer Inscription
        </span>
        <h2 className="text-xl font-serif font-bold text-[#23324A] mb-1.5 max-w-xs truncate">
          {taskTitle}
        </h2>
        {/* Reframed copy (v4 Part A #4) */}
        <p className="text-xs text-[#4E5E7A] mb-8 font-medium">
          Server-timed session — stay active to bank rewards.
        </p>

        {/* Circular Antique Brass Timer Ring */}
        <div className="relative w-56 h-56 mb-8 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="100"
              className="stroke-[#DDD6C6]"
              strokeWidth="6"
              fill="none"
            />
            <motion.circle
              cx="112"
              cy="112"
              r="100"
              className="stroke-[#A87C3F]"
              strokeWidth="6"
              fill="none"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - (elapsed % 60) / 60)}
              strokeLinecap="round"
              key={`pulse-${heartbeats}`}
            />
          </svg>
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-[#23324A] mb-1.5 tracking-tight">
              {formatTime(elapsed)}
            </div>
            <div className="text-xs text-[#A87C3F] font-serif font-semibold flex items-center justify-center gap-1">
              <span>✦</span>
              <span>{heartbeats} Server Intervals Banked</span>
            </div>
          </div>
        </div>

        <button
          onClick={endSession}
          className="w-full py-3 px-6 bg-[#A87C3F] hover:bg-[#926B34] text-white font-serif font-bold text-sm rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Bank Rewards & Inscribe (Space)</span>
        </button>
        <p className="text-[11px] text-[#4E5E7A] mt-3">Press Esc to abandon session</p>
      </motion.div>
    </div>
  );
}
