'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 rounded-xl parchment-shadow border border-[#C99E60]/40 bg-[#E7E1D3] text-[#23324A]"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif font-bold text-sm tracking-wide text-[#A87C3F]">
                LEDGER ENTRY · {toast.attributeName.toUpperCase()}
              </span>
              {toast.shadowDefeated && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#6B8F71] text-white">
                  STAIN LIFTED
                </span>
              )}
            </div>

            {/* Three-Figure Transparent Ledger Line (v4 Part A #7) */}
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold mt-2">
              <span className="text-[#23324A]">
                Earned <span className="font-bold">+{toast.earned}</span>
              </span>
              <span className="text-[#4E5E7A]">·</span>
              
              {toast.stolen > 0 ? (
                <span className="text-[#8B3A3A]">
                  Shadow took <span className="font-bold">-{toast.stolen}</span>
                </span>
              ) : (
                <span className="text-[#4E5E7A]">Shadow took 0</span>
              )}
              
              <span className="text-[#4E5E7A]">·</span>
              <span className="text-[#23324A] bg-[#DDD6C6] px-2 py-0.5 rounded">
                Secured <span className="font-bold">+{toast.secured} XP</span>
              </span>
            </div>

            {/* Reclaimed XP triumphant notice */}
            {toast.reclaimed && toast.reclaimed > 0 ? (
              <div className="mt-2.5 pt-2 border-t border-[#C99E60]/30 text-xs font-bold text-[#466B4C] flex items-center gap-1.5">
                <span>✦</span>
                <span>Reclaimed +{toast.reclaimed} lost XP from the banished Shadow!</span>
              </div>
            ) : null}
          </div>

          <button
            onClick={onDismiss}
            className="text-[#4E5E7A] hover:text-[#23324A] text-lg font-bold p-1 ml-2"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
