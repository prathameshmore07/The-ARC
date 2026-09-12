"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function ShadowEntity({ shadow }: { shadow: any }) {
  const progress = Math.min(100, (shadow.sealProgress / shadow.stepsNeeded) * 100);
  const fading = shadow.sealProgress >= shadow.stepsNeeded - 1;

  return (
    <motion.div 
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: fading ? [0.8, 0.4, 0.8] : 1,
        transition: fading ? { repeat: Infinity, duration: 0.5 } : {}
      }}
    >
      {/* Glitch Effect Element */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-t from-violet-900/30 to-transparent mix-blend-overlay pointer-events-none"
        animate={{ y: ["-100%", "100%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      />

      <motion.div
        animate={{ y: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="text-center w-full"
      >
        <h4 className="text-violet-400 font-bold text-sm tracking-widest uppercase mb-1 drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]">
          Shadow Entity
        </h4>
        <p className="text-red-400 text-xs mb-3 font-mono">
          ⚠ Steals {shadow.stealRate * 100}% of XP
        </p>

        {/* Seal Progress */}
        <div className="w-full max-w-[120px] mx-auto mt-2">
          <div className="flex justify-between text-[10px] text-violet-300 mb-1">
            <span>Banishment</span>
            <span>{shadow.sealProgress}/{shadow.stepsNeeded}</span>
          </div>
          <div className="flex space-x-1">
            {Array.from({ length: shadow.stepsNeeded }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-sm ${
                  i < shadow.sealProgress 
                    ? 'bg-violet-500 shadow-[0_0_5px_rgba(139,92,246,1)]' 
                    : 'bg-slate-800'
                }`} 
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
