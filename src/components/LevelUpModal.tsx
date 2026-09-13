'use client';

import React from 'react';
import { Sparkles, ArrowRight, Shield } from 'lucide-react';

export default function LevelUpModal({
  oldLevel = 7,
  newLevel = 8,
  oldTitle = 'BUILDER',
  newTitle = 'MOMENTUM',
  onClose,
}: {
  oldLevel?: number;
  newLevel?: number;
  oldTitle?: string;
  newTitle?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-500"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full rounded-xl border border-[#C5A059]/80 bg-gradient-to-b from-[#0F1622] via-[#0A0F16] to-[#06090E] p-8 sm:p-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.95)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient warm celestial halo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#C5A059] bg-[#C5A059]/15 text-[#C5A059] mb-5 shadow-[0_0_30px_rgba(197,160,89,0.35)]">
            <Sparkles className="w-8 h-8" />
          </div>

          <span className="block font-mono text-[10px] tracking-[0.3em] text-[#C5A059] uppercase font-semibold mb-2">
            ARC ASCENSION · LEVEL ADVANCEMENT
          </span>

          <div className="flex items-center justify-center gap-4 text-3xl sm:text-5xl font-display font-bold text-[#F2EEE6] uppercase tracking-tight my-4">
            <span className="text-[#8B97A6]">LEVEL {String(oldLevel).padStart(2, '0')}</span>
            <span className="text-[#C5A059] text-2xl sm:text-3xl">→</span>
            <span className="text-[#F2EEE6]">LEVEL {String(newLevel).padStart(2, '0')}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="font-mono text-xs text-[#C5A059] uppercase tracking-widest font-semibold">
              NEW TITLE UNLOCKED · {newTitle}
            </span>
          </div>

          <p className="font-sans text-xs sm:text-sm text-[#A6B2C0] font-light leading-relaxed max-w-md mx-auto mb-8">
            Compounding discipline takes hold. Your daily recurrence has established an elevated baseline across all four capabilities.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 px-6 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-sans text-xs tracking-[0.22em] uppercase font-semibold transition-all rounded shadow-[0_4px_25px_rgba(197,160,89,0.35)] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue Your Arc</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
