'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Shield, Zap, ArrowRight, X, Activity, AlertCircle } from 'lucide-react';
import { playComicIntro, playChime } from '@/lib/sound-effects';
import { ArcAttributeKey } from '@/lib/game-engine';

interface AdaptiveArcModalProps {
  open: boolean;
  onClose: () => void;
  onAcceptQuests?: (quests: any[]) => void;
}

interface EvaluationResult {
  observation: string;
  focusArea: ArcAttributeKey;
  difficultyAdjustment: 'MAINTAIN' | 'INCREASE' | 'EASE';
  nextMilestone: {
    title: string;
    target: string;
    measurement: string;
  };
  recommendedQuests: Array<{
    id: string;
    archetype: string;
    title: string;
    attribute: ArcAttributeKey;
    difficulty: string;
  }>;
}

export default function AdaptiveArcModal({ open, onClose, onAcceptQuests }: AdaptiveArcModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<EvaluationResult | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      playComicIntro();
      setLoading(true);
      setError(false);
      setData(null);

      const fetchEvaluation = async () => {
        try {
          const res = await fetch('/api/arc/evaluate', { method: 'POST' });
          if (!res.ok) throw new Error('Evaluation failed');
          const result = await res.json();
          setData(result);
        } catch (err) {
          console.error('Error evaluating arc:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      };

      fetchEvaluation();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      const focusableElements = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, data, loading, error]);

  const handleAccept = () => {
    playChime();
    if (onAcceptQuests && data) {
      onAcceptQuests(data.recommendedQuests);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adaptive-arc-title"
      >
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl bg-[#06090E] border border-[#C5A059]/30 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Dot matrix background */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
          />
          
          <div className="relative p-6 border-b border-white/5 flex justify-between items-center bg-[#0A0F16]">
            <h2 id="adaptive-arc-title" className="text-[#C5A059] font-mono tracking-widest text-sm uppercase flex items-center gap-2">
              <Compass className="w-4 h-4" />
              Adaptive Arc Strategy
            </h2>
            <button 
              onClick={onClose}
              className="text-[#EDE8DF]/50 hover:text-[#EDE8DF] transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative p-6 overflow-y-auto flex-1 text-[#F2EEE6]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                >
                  <Activity className="w-12 h-12 text-[#C5A059] mb-4" />
                </motion.div>
                <p className="font-mono text-[#D4B57A] tracking-widest animate-pulse">CALIBRATING YOUR ARC...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-12 h-12 text-[#8F1D1D] mb-4 opacity-80" />
                <p className="font-mono text-[#A63F3F] tracking-wider mb-2">THE ARC CONTINUES</p>
                <p className="text-[#EDE8DF]/70 text-sm">Strategy unavailable &middot; Your momentum persists.</p>
                <button 
                  onClick={onClose}
                  className="mt-8 px-6 py-2 border border-white/10 hover:bg-white/5 transition-colors font-mono text-xs tracking-wider"
                >
                  RETURN TO OBSIDIAN
                </button>
              </div>
            )}

            {data && !loading && !error && (
              <motion.div 
                className="space-y-8"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1 } }
                }}
              >
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <h3 className="text-xs font-mono text-white/50 tracking-wider mb-2">STRATEGIC OBSERVATION</h3>
                  <p className="text-lg font-serif italic text-[#EDE8DF]/90 border-l-2 border-[#8F1D1D] pl-4 py-1">
                    &quot;{data.observation}&quot;
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-[#0A0F16] border border-white/5 p-4 flex flex-col">
                    <span className="text-[10px] font-mono text-white/40 tracking-wider mb-2">FOCUS AREA</span>
                    <div className="flex items-center gap-2 text-[#C5A059]">
                      <Zap className="w-4 h-4" />
                      <span className="font-bold tracking-wide">{data.focusArea}</span>
                    </div>
                  </motion.div>
                  
                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-[#0A0F16] border border-white/5 p-4 flex flex-col">
                    <span className="text-[10px] font-mono text-white/40 tracking-wider mb-2">DIFFICULTY ADJUSTMENT</span>
                    <div className="flex items-center gap-2 text-[#F2EEE6]">
                      <Shield className="w-4 h-4 opacity-70" />
                      <span className="font-bold tracking-wide">{data.difficultyAdjustment}</span>
                    </div>
                  </motion.div>

                  <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="bg-[#0A0F16] border border-white/5 p-4 flex flex-col">
                    <span className="text-[10px] font-mono text-white/40 tracking-wider mb-2">NEXT MILESTONE</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-[#F2EEE6]">{data.nextMilestone.title}</span>
                      <span className="text-xs text-[#C5A059]/70 mt-1">{data.nextMilestone.target} ({data.nextMilestone.measurement})</span>
                    </div>
                  </motion.div>
                </div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <h3 className="text-xs font-mono text-white/50 tracking-wider mb-4 border-b border-white/10 pb-2">RECOMMENDED QUESTS</h3>
                  <div className="space-y-3">
                    {data.recommendedQuests.map((quest, idx) => (
                      <div key={idx} className="bg-[#0C121B] border border-[#C5A059]/20 p-4 hover:border-[#C5A059]/50 transition-colors group flex items-center justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-mono bg-[#8F1D1D]/20 text-[#A63F3F] px-2 py-0.5">{quest.archetype}</span>
                            <span className="text-[10px] uppercase font-mono bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5">{quest.attribute}</span>
                            <span className="text-[10px] uppercase font-mono text-white/40">{quest.difficulty}</span>
                          </div>
                          <h4 className="text-[#F2EEE6] font-medium tracking-wide">{quest.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
          
          {data && !loading && !error && (
            <div className="relative p-6 border-t border-white/5 bg-[#06090E] flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 font-mono text-xs tracking-wider text-white/50 hover:text-white transition-colors"
              >
                CONTINUE CURRENT ARC
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-3 bg-[#C5A059]/10 border border-[#C5A059]/50 text-[#D4B57A] hover:bg-[#C5A059]/20 hover:border-[#C5A059] transition-all font-mono text-xs tracking-wider flex items-center gap-2 justify-center"
              >
                INSCRIBE THESE QUESTS
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
