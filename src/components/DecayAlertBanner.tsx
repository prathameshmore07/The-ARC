"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecayAlertBanner({ decayedAttributes }: { decayedAttributes: { name: string, xpLost: number }[] }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!decayedAttributes || decayedAttributes.length === 0 || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, margin: 0, overflow: 'hidden' }}
        className="bg-gradient-to-r from-red-900/90 to-orange-900/90 border-b border-red-500/50 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label="warning">💀</span>
            <div>
              <h4 className="font-bold text-red-100">Attribute Decay Detected!</h4>
              <p className="text-sm text-red-200">
                {decayedAttributes.map(attr => `${attr.name} (-${attr.xpLost} XP)`).join(', ')} while you were away.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-red-800/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
