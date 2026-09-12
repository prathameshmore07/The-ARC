'use client';

import React, { useState } from 'react';

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
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#A87C3F]/50 bg-[#23324A] hover:bg-[#2D3E5C] text-[#E7E1D3] text-xs font-serif tracking-wide transition-all shadow-sm"
        title="Fast-forward days to simulate neglect and observe the ink stain"
      >
        <span className="text-[#A87C3F] text-sm">⏳</span>
        <span>Chrono Dial</span>
        <span className="text-[10px] text-[#A87C3F] bg-[#1C2333] px-1.5 py-0.5 rounded font-mono">
          +{days}d
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 rounded-xl parchment-shadow border border-[#A87C3F] bg-[#E7E1D3] text-[#23324A] z-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-serif font-bold text-sm text-[#23324A]">Turn the Ledger Page</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#4E5E7A] hover:text-[#23324A]"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-[#4E5E7A] mb-3 leading-relaxed">
            Advance time to simulate neglect. Watch how the ink stain bleeds across your journal entries based on your past habits.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Time Leap:</span>
              <span className="font-mono text-[#A87C3F] font-bold">
                {days} {days === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="7"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="w-full accent-[#A87C3F] cursor-pointer"
            />

            <button
              onClick={handleTurnPage}
              disabled={turning}
              className="w-full py-2 bg-[#A87C3F] hover:bg-[#926B34] disabled:opacity-50 text-white font-serif font-bold text-xs rounded-lg transition-colors shadow"
            >
              {turning ? 'Advancing Time...' : `Simulate ${days} Days Neglect`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
