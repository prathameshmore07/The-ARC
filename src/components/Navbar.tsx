"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Navbar({ user, grit, totalLevel }: { user: any, grit: number, totalLevel: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500">
              Entropy Engine
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-amber-400">💰</span>
              <span className="text-white font-medium">{grit} Grit</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              <span className="text-cyan-400 font-bold">Lvl {totalLevel}</span>
            </div>
            
            <span className="text-slate-300 text-sm truncate max-w-[150px]">
              {user?.email}
            </span>
            
            <button 
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-slate-800 bg-slate-900/95"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="flex justify-between items-center px-3 py-2 text-white">
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400">💰</span>
                  <span>{grit} Grit</span>
                </div>
                <div className="text-cyan-400 font-bold">Lvl {totalLevel}</div>
              </div>
              <div className="px-3 py-2 text-slate-300 text-sm">{user?.email}</div>
              <button 
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
