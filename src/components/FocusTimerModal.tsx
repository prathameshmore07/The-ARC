"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function FocusTimerModal({ taskId, taskTitle, onComplete, onClose }: { taskId: string, taskTitle: string, onComplete: (sessionId: string) => void, onClose: () => void }) {
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
    return () => { mounted = false; };
  }, [taskId]);

  // Timer & Heartbeat interval
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        // Every 30 seconds, send a heartbeat
        if (next % 30 === 0) {
          fetch('/api/sessions/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          }).then(res => {
            if (res.ok) setHeartbeats(h => h + 1);
          }).catch(err => console.error('Heartbeat failed', err));
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
        body: JSON.stringify({ sessionId })
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
        if (window.confirm('Abandon focus session? Progress will be lost.')) onClose();
      } else if (e.code === 'Space') {
        e.preventDefault();
        endSession();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [endSession, onClose]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressColor = elapsed % 60 > 30 ? 'stroke-violet-500' : 'stroke-cyan-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2 max-w-md text-center truncate px-4">{taskTitle}</h2>
        <p className="text-slate-400 mb-8">Focus Session Active</p>

        <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="128" cy="128" r="120" className="stroke-slate-800" strokeWidth="8" fill="none" />
            <motion.circle 
              cx="128" cy="128" r="120" 
              className={`${progressColor} transition-colors duration-1000`} 
              strokeWidth="8" fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - (elapsed % 60) / 60)}
              strokeLinecap="round"
              animate={heartbeats > 0 ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.5 }}
              key={`pulse-${heartbeats}`}
            />
          </svg>
          <div className="text-center">
            <div className="text-5xl font-mono font-bold text-white mb-2">{formatTime(elapsed)}</div>
            <div className="text-sm text-amber-400 flex items-center justify-center space-x-1">
              <span>🔥</span>
              <span>{heartbeats} Heartbeats</span>
            </div>
          </div>
        </div>

        <button 
          onClick={endSession}
          className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        >
          End & Submit (Space)
        </button>
      </motion.div>
    </div>
  );
}
