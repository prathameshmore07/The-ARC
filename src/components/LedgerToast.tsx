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
        className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-xl parchment-shadow border border-[var(--brass)]/40 bg-[var(--page-bone)] text-[var(--fresh-ink)]"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif font-bold text-xs tracking-wider text-[var(--brass)] uppercase">
                Ledger Entry · {toast.attributeName}
              </span>
              {toast.shadowDefeated && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--reclaim)] text-white">
                  Stain Lifted
                </span>
              )}
            </div>

            {/* Three-Figure Transparent Ledger Line (v4 Part A #7 & Section 3.7) */}
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold mt-2">
              <span className="text-[var(--fresh-ink)]">
                +{toast.earned} earned
              </span>
              <span className="text-[var(--fresh-ink)]/40">→</span>
              
              {toast.stolen > 0 ? (
                <span className="text-red-700">
                  −{toast.stolen} taken by Shadow
                </span>
              ) : (
                <span className="text-[var(--fresh-ink)]/60">0 taken</span>
              )}
              
              <span className="text-[var(--fresh-ink)]/40">→</span>
              <span className="text-[var(--fresh-ink)] bg-[var(--page-bone-dim)] px-2 py-0.5 rounded font-bold">
                {toast.secured} XP secured
              </span>
            </div>

            {/* Reclaimed XP triumphant notice */}
            {toast.reclaimed && toast.reclaimed > 0 ? (
              <div className="mt-2.5 pt-2 border-t border-[var(--brass)]/30 text-xs font-bold text-[var(--reclaim)] flex items-center gap-1.5 font-serif">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reclaimed +{toast.reclaimed} lost XP from the banished Shadow!</span>
              </div>
            ) : null}
          </div>

          <button
            onClick={onDismiss}
            className="text-[var(--fresh-ink)]/50 hover:text-[var(--fresh-ink)] p-1 ml-2 cursor-pointer"
            aria-label="Dismiss ledger notification"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
