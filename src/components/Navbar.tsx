"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function Navbar({
  user,
  grit,
  totalLevel,
  children,
}: {
  user: any;
  grit: number;
  totalLevel: number;
  children?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' });
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}

    try {
      document.cookie = 'ee_demo_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;';
      localStorage.removeItem('arc_onboarding_completed');
      localStorage.removeItem('arc_user_profile');
      localStorage.removeItem('arc_primary_path');
      localStorage.removeItem('arc_starter_quests');
      localStorage.removeItem('arc_personal_plan');
      localStorage.removeItem('arc_plan');
      sessionStorage.clear();
    } catch {}

    window.location.href = '/?logout=true';
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#1C2333]/95 backdrop-blur-md border-b border-[#2A354C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <span className="text-xl">📜</span>
            <div>
              <span className="font-serif font-bold text-lg text-[#E7E1D3] tracking-tight block leading-tight">
                The Living Ledger
              </span>
              <span className="text-[10px] text-[#A87C3F] font-serif tracking-widest uppercase block">
                The ARC
              </span>
            </div>
          </div>

          {/* Desktop Toolbar */}
          <div className="hidden md:flex items-center space-x-4">
            {children}

            <div className="flex items-center space-x-2 bg-[#23324A] px-3.5 py-1.5 rounded-lg border border-[#A87C3F]/30">
              <span className="text-sm">🪙</span>
              <span className="text-[#E7E1D3] font-mono text-xs font-semibold">{grit} Grit</span>
            </div>
            
            <div className="flex items-center space-x-1.5 bg-[#23324A] px-3.5 py-1.5 rounded-lg border border-[#2A354C]">
              <span className="text-xs font-serif text-[#A87C3F]">Rank Lvl</span>
              <span className="text-[#E7E1D3] font-mono font-bold text-xs">{totalLevel}</span>
            </div>
            
            <span className="text-[#9AA5B8] text-xs truncate max-w-[160px]">
              {user?.email}
            </span>
            
            <button 
              onClick={handleSignOut}
              className="px-3 py-1.5 text-xs text-[#9AA5B8] hover:text-[#E7E1D3] transition-colors border border-transparent hover:border-[#2A354C] rounded-md font-serif"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            {children}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#9AA5B8] hover:text-[#E7E1D3] p-1.5"
              aria-label="Toggle Navigation"
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
            className="md:hidden border-t border-[#2A354C] bg-[#1C2333]/98 px-4 py-3 space-y-2.5"
          >
            <div className="flex justify-between items-center text-xs py-1">
              <div className="flex items-center space-x-2">
                <span>🪙</span>
                <span className="font-mono text-[#E7E1D3] font-semibold">{grit} Grit</span>
              </div>
              <div className="text-[#A87C3F] font-serif font-bold">Rank Level {totalLevel}</div>
            </div>
            <div className="text-[#9AA5B8] text-xs">{user?.email}</div>
            <button 
              onClick={handleSignOut}
              className="block w-full text-left py-2 text-xs font-serif text-[#9AA5B8] hover:text-[#E7E1D3] border-t border-[#2A354C]"
            >
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
