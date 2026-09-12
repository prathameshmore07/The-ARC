'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

export interface LedgerToastData {
  earned: number;
  stolen: number;
  secured: number;
  reclaimed?: number;
  shadowDefeated?: boolean;
  attributeName: string;
}

export default function LedgerToast({
  toast,
  onDismiss,
}: {
  toast: LedgerToastData | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-xl shadow-rpg-md border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] text-[var(--text-body)]"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif font-bold text-xs tracking-wider text-[var(--accent-amber)] uppercase">
                Quest Secured · {toast.attributeName}
              </span>
              {toast.shadowDefeated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-forest)] text-white">
                  Shadow Banished
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold mt-2">
              <span className="text-[var(--text-headline)]">
                +{toast.earned} earned
              </span>
              <span className="text-[var(--text-faint)]">→</span>
              
              {toast.stolen > 0 ? (
                <span className="text-red-400">
                  −{toast.stolen} taken by Shadow
                </span>
              ) : (
                <span className="text-[var(--text-dim)]">0 taken</span>
              )}
              
              <span className="text-[var(--text-faint)]">→</span>
              <span className="text-amber-200 bg-[var(--bg-surface-2)] px-2 py-0.5 rounded font-bold border border-[var(--border-subtle)]">
                {toast.secured} XP secured
              </span>
            </div>

            {toast.reclaimed && toast.reclaimed > 0 ? (
              <div className="mt-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-serif">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reclaimed +{toast.reclaimed} lost XP from the banished Shadow!</span>
              </div>
            ) : null}
          </div>

          <button
            onClick={onDismiss}
            className="text-[var(--text-faint)] hover:text-[var(--text-headline)] p-1 ml-2 cursor-pointer"
            aria-label="Dismiss ledger notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
