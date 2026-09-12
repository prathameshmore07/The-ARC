"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { getLevelTitle, levelProgress } from '@/lib/game-engine';
import ShadowEntity from './ShadowEntity';

export default function AttributeCard({ attribute }: { attribute: any }) {
  // Compute progress safely between 0% and 100%
  const progressFraction = typeof attribute.progress === 'number' 
    ? attribute.progress 
    : levelProgress(attribute.xp || 0, attribute.level || 1);
  const progress = Math.max(0, Math.min(100, Math.round(progressFraction * 100)));
  
  const isDecaying = attribute.decayStatus === 'decaying' || attribute.status === 'decaying';
  const isVulnerable = attribute.decayStatus === 'vulnerable' || attribute.status === 'vulnerable';

  // Animation variants
  const shakeVariant = {
    animate: { x: [-2, 2, -2, 2, 0], transition: { repeat: Infinity, duration: 0.5 } }
  };
  
  const pulseVariant = {
    animate: { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 2 } }
  };

  return (
    <motion.div 
      className={`relative p-5 rounded-xl border bg-slate-800/50 transition-colors ${
        isDecaying ? 'border-red-500/50' : isVulnerable ? 'border-amber-500/50' : 'border-slate-700 hover:border-cyan-500/50'
      } overflow-hidden`}
      variants={isDecaying ? shakeVariant : isVulnerable ? pulseVariant : undefined}
      animate="animate"
    >
      {/* Background Glow */}
      <div className={`absolute inset-0 opacity-10 ${
        isDecaying ? 'bg-red-500' : isVulnerable ? 'bg-amber-500' : 'bg-cyan-500'
      }`} />

      {attribute.shadow && (
        <ShadowEntity shadow={attribute.shadow} />
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-white">{attribute.name}</h3>
            <p className="text-xs text-slate-400">{getLevelTitle(attribute.level || 1)}</p>
          </div>
          <div className="flex items-center space-x-1 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-700">
            <span className="text-orange-500">🔥</span>
            <span className="text-white font-mono text-sm">{attribute.streak || 0}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-cyan-400 font-bold">Lvl {attribute.level || 1}</span>
            <span className="text-slate-400">{attribute.xp || 0} XP</span>
          </div>
          
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <motion.div 
              className={`h-full ${isDecaying ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-violet-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Status indicator */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            {attribute.xpForNextLevel ? `Next: ${attribute.xpForNextLevel} XP` : ''}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-bold ${
            isDecaying ? 'text-red-400' : isVulnerable ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {isDecaying ? 'Decaying' : isVulnerable ? 'Vulnerable' : 'Stable'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
