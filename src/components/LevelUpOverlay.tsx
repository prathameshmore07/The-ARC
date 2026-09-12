'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LevelUpData {
  attributeName: string;
  newLevel: number;
}

export default function LevelUpOverlay({
  levelUp,
  onDismiss,
}: {
  levelUp: LevelUpData | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!levelUp) return;
    // Auto-dismiss in 1.5 seconds (Section 3.10: 1.2-1.8s max, never require click)
    const timer = setTimeout(() => {
      onDismiss();
    }, 1500);
    return () => clearTimeout(timer);
  }, [levelUp, onDismiss]);

  if (!levelUp) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none"
        aria-live="assertive"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center p-8 max-w-sm w-full"
        >
          <span className="font-serif font-bold text-7xl sm:text-8xl text-[var(--text-headline)] block tracking-tight">
            Level {levelUp.newLevel}
          </span>
          <p className="text-base text-[var(--text-dim)] mt-3 mb-6 font-medium">
            Your discipline echoes across the chronicle.
          </p>

          {/* Particle chip flying in */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[var(--accent-amber)] text-[var(--bg-base)] font-serif font-bold text-xs shadow-rpg-md"
          >
            <span>+1 {levelUp.attributeName}</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
