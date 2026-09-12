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
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] hover:border-[var(--border-hover)] text-[var(--text-headline)] text-xs font-serif tracking-wide transition-all shadow-rpg-sm cursor-pointer"
        title="Fast-forward days to simulate neglect and observe shadow growth"
      >
        <Clock className="w-3.5 h-3.5 text-[var(--accent-amber)]" aria-hidden="true" />
        <span>Chrono Dial</span>
        <span className="text-[10px] text-[var(--accent-amber)] bg-[var(--bg-base)] px-1.5 py-0.5 rounded font-sans font-semibold border border-[var(--border-subtle)]">
          +{days}d
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl shadow-rpg-md border border-[var(--border-subtle)] bg-[var(--bg-surface-1)] text-[var(--text-body)] z-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif font-bold text-sm text-[var(--text-headline)]">Chrono Dial</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--text-faint)] hover:text-[var(--text-headline)] p-1 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-dim)] mb-3 leading-relaxed font-sans">
            Fast-forward simulation time to evaluate how neglected disciplines decay and awaken shadows based on past frequency.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text-dim)]">Simulate Passage:</span>
              <span className="text-[var(--accent-amber)] font-bold">
                {days} {days === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full accent-[var(--accent-amber)] cursor-pointer"
            />

            <button
              onClick={handleTurnPage}
              disabled={turning}
              className="w-full py-2 bg-[var(--accent-slate)] hover:bg-slate-500 disabled:opacity-50 text-white font-serif font-bold text-xs rounded-lg transition-colors shadow-rpg-sm cursor-pointer"
            >
              {turning ? 'Simulating...' : `Simulate ${days} Days Neglect`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
