"use client";
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { getLevelTitle } from '@/lib/game-engine';

export default function LevelUpModal({
  attributeName,
  newLevel,
  levelTitle,
  onClose
}: {
  attributeName: string;
  newLevel: number;
  levelTitle?: string;
  onClose: () => void;
}) {
  const displayTitle = levelTitle || getLevelTitle(newLevel);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md cursor-pointer overflow-hidden"
      onClick={onClose}
    >
      {/* Particle burst */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: 0, 
              scale: Math.random() * 2 + 1,
              x: (Math.random() - 0.5) * 500,
              y: (Math.random() - 0.5) * 500
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-3 h-3 bg-gradient-to-r from-cyan-400 to-amber-300 rounded-full blur-[1px]"
          />
        ))}
      </div>

      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 100 }}
        className="text-center relative z-10 p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_50px_rgba(34,211,238,0.3)] max-w-md w-full mx-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -z-10 bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 blur-2xl rounded-3xl"
        />
        
        <span className="inline-block text-4xl mb-3 animate-bounce">⚡</span>
        <h3 className="text-xl text-cyan-400 font-bold mb-1 uppercase tracking-widest">
          {attributeName} Surge!
        </h3>
        <div className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.7)] my-2">
          {newLevel}
        </div>
        <p className="text-lg text-violet-300 font-medium">Rank Achieved: {displayTitle}</p>
        <p className="text-xs text-slate-400 mt-4">Tap anywhere to dismiss</p>
      </motion.div>
    </div>
  );
}
