"use client";
import React, { useState } from 'react';

export default function DemoControlBar({ onSimulate }: { onSimulate: (days: number) => void }) {
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';

  if (!isDemo) return null;

  const handleSimulate = async () => {
    try {
      setLoading(true);
      await fetch('/api/cron/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      onSimulate(days);
    } catch (err) {
      console.error('Simulation failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-950/95 border-t-2 border-amber-500/80 p-3.5 backdrop-blur-md shadow-[0_-10px_30px_rgba(245,158,11,0.3)] flex flex-col sm:flex-row items-center justify-between text-amber-100 max-w-full">
      <div className="flex items-center space-x-2.5 mb-2 sm:mb-0">
        <span className="font-mono font-bold text-amber-300 uppercase text-[11px] tracking-wider bg-amber-900/60 border border-amber-500/60 px-2.5 py-1 rounded">
          ⚡ Judge Demo Mode
        </span>
        <span className="text-xs text-amber-200/90 hidden md:inline">
          Fast-forward time leap to manifest Shadow & observe Entropy Decay
        </span>
      </div>

      <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
        <div className="flex items-center space-x-2">
          <input 
            type="range" 
            min="1" 
            max="7" 
            value={days} 
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-28 sm:w-36 accent-amber-500 cursor-pointer"
            aria-label="Simulate Days Inactive"
          />
          <span className="text-xs font-mono font-bold text-amber-300 w-16 text-right">
            +{days} {days === 1 ? 'day' : 'days'}
          </span>
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading}
          className="bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded-lg shadow-md transition-all text-xs flex items-center gap-1.5"
        >
          <span>⏳</span>
          <span>{loading ? 'Simulating...' : 'Simulate Decay'}</span>
        </button>
      </div>
    </div>
  );
}
