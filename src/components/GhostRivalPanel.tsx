"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface GhostSnapshot {
  id?: string;
  date: string | Date;
  totalXp: number;
}

export default function GhostRivalPanel({
  snapshots = [],
  currentTotalXp = 0
}: {
  snapshots: GhostSnapshot[];
  currentTotalXp: number;
}) {
  const ghostXP = snapshots.length > 0 
    ? (snapshots[snapshots.length - 1]?.totalXp ?? (snapshots[snapshots.length - 1] as any)?.xp ?? 0)
    : Math.max(0, Math.round(currentTotalXp * 0.85)); // Intelligent benchmark for new players

  const diff = currentTotalXp - ghostXP;

  // Generate SVG polyline points for current trajectory vs ghost trajectory
  const generatePoints = (targetXp: number, curve: number[]) => {
    return curve.map((pct, idx) => {
      const x = (idx / (curve.length - 1)) * 100;
      const y = 90 - (pct * 70); // invert for SVG y-axis
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const ghostPoints = generatePoints(ghostXP, [0.15, 0.25, 0.4, 0.55, 0.65, 0.8, 0.88]);
  const playerPoints = generatePoints(currentTotalXp, [0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.0]);

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 flex flex-col h-[300px]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>👻</span> Ghost Rival
        </h2>
        <span className="text-xs text-slate-500 font-mono">7-Day Mirror</span>
      </div>
      
      <div className="mb-4">
        {diff >= 0 ? (
          <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium bg-cyan-400/10 px-3 py-1 rounded-md text-sm border border-cyan-500/20">
            <span>▲</span> +{diff} XP ahead of Ghost
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-violet-400 font-medium bg-violet-400/10 px-3 py-1 rounded-md text-sm border border-violet-500/20">
            <span>▼</span> Ghost leads by {Math.abs(diff)} XP
          </span>
        )}
      </div>

      <div className="flex-1 relative w-full mt-2">
        {/* SVG Comparative Chart */}
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
          <line x1="0" y1="55" x2="100" y2="55" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />
          <line x1="0" y1="90" x2="100" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.3" />

          {/* Ghost Line */}
          <polyline 
            fill="none" 
            stroke="#8b5cf6" 
            strokeWidth="2.5" 
            strokeDasharray="4 4"
            points={ghostPoints} 
          />
          {/* Current Player Line */}
          <motion.polyline 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="3" 
            points={playerPoints} 
          />
        </svg>

        <div className="absolute inset-0 flex justify-between items-end text-[10px] text-slate-500 pointer-events-none -bottom-2">
          <span>7d ago</span>
          <span>Today</span>
        </div>
      </div>
      
      <div className="flex justify-center space-x-6 mt-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-violet-500 border border-violet-500 border-dashed" />
          <span className="text-slate-400">Ghost ({ghostXP} XP)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-0.5 bg-cyan-400" />
          <span className="text-slate-300 font-semibold">You ({currentTotalXp} XP)</span>
        </div>
      </div>
    </div>
  );
}
