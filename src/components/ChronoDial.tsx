'use client';

import React, { useState } from 'react';
import { Clock, X } from 'lucide-react';

export default function ChronoDial({
  onFastForward,
}: {
  onFastForward: (days: number) => Promise<void>;
}) {
  const [days, setDays] = useState(3);
  const [turning, setTurning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleTurnPage = async () => {
    try {
      setTurning(true);
      await onFastForward(days);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to advance ledger time:', err);
    } finally {
      setTurning(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[var(--brass)]/50 bg-[var(--fresh-ink)] hover:bg-[#2D3E5C] text-[var(--page-bone)] text-xs font-serif tracking-wide transition-all shadow-sm cursor-pointer"
        title="Fast-forward days to simulate neglect and observe the ink stain"
      >
        <Clock className="w-3.5 h-3.5 text-[var(--brass)]" aria-hidden="true" />
        <span>Chrono Dial</span>
        <span className="text-[10px] text-[var(--brass)] bg-[var(--ink-navy)] px-1.5 py-0.5 rounded font-sans font-semibold">
          +{days}d
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl parchment-shadow border border-[var(--brass)] bg-[var(--page-bone)] text-[var(--fresh-ink)] z-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif font-bold text-sm text-[var(--fresh-ink)]">Turn the Ledger Page</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--fresh-ink)]/60 hover:text-[var(--fresh-ink)] p-1 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-[11px] text-[var(--fresh-ink)]/70 mb-3 leading-relaxed font-sans">
            Advance time to simulate neglect. Watch how the ink stain bleeds across your journal entries based on your past habits.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Time Leap:</span>
              <span className="text-[var(--brass)] font-bold">
                {days} {days === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full accent-[var(--brass)] cursor-pointer"
            />

            <button
              onClick={handleTurnPage}
              disabled={turning}
              className="w-full py-2 bg-[var(--brass)] hover:bg-[var(--brass-bright)] disabled:opacity-50 text-[var(--ink-navy)] font-serif font-bold text-xs rounded-lg transition-colors shadow cursor-pointer"
            >
              {turning ? 'Advancing Time...' : `Simulate ${days} Days Neglect`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
