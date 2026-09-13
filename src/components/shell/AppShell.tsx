'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Scroll,
  User as UserIcon,
  MapPin,
  Shield,
  Clock,
  Settings as SettingsIcon,
  LogOut,
  X,
  Flame,
  Award,
  Sparkles,
  Coins,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

function CompassRose({ className = 'w-6 h-6 text-[#C5A059]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="26" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="8" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="3.5" fill="currentColor" />
      <polygon points="50,4 47,40 50,42 53,40" fill="currentColor" />
      <polygon points="50,96 47,60 50,58 53,60" fill="currentColor" />
      <polygon points="4,50 40,47 42,50 40,53" fill="currentColor" />
      <polygon points="96,50 60,47 58,50 60,53" fill="currentColor" />
      <line x1="28" y1="28" x2="72" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="72" y1="28" x2="28" y2="72" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  userMomentum?: number;
  userLevelTitle?: string;
  userName?: string;
  userMarks?: number;
  userStreak?: number;
  equippedTitle?: string;
  equippedInsignia?: string;
  userLevel?: number;
}

export default function AppShell({
  children,
  userName = 'Adventurer',
  userMomentum = 742,
  userLevelTitle = 'BUILDER',
  userMarks = 184,
  userStreak = 7,
  equippedTitle = 'THE BUILDER',
  equippedInsignia = 'CELESTIAL COMPASS',
  userLevel = 7,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [focusDuration, setFocusDuration] = useState<number>(45);

  // Live synchronizable HUD metrics
  const [liveMarks, setLiveMarks] = useState(userMarks);
  const [liveStreak, setLiveStreak] = useState(userStreak);
  const [liveTitle, setLiveTitle] = useState(equippedTitle);
  const [liveInsignia, setLiveInsignia] = useState(equippedInsignia);

  useEffect(() => {
    setLiveMarks(userMarks);
  }, [userMarks]);

  useEffect(() => {
    setLiveStreak(userStreak);
  }, [userStreak]);

  useEffect(() => {
    setLiveTitle(equippedTitle);
  }, [equippedTitle]);

  useEffect(() => {
    setLiveInsignia(equippedInsignia);
  }, [equippedInsignia]);

  // Listen to cross-app updates (e.g., when a quest is completed or item equipped)
  useEffect(() => {
    const handleStateUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (typeof customEvent.detail.marks === 'number') {
          setLiveMarks(customEvent.detail.marks);
        }
        if (typeof customEvent.detail.streak === 'number') {
          setLiveStreak(customEvent.detail.streak);
        }
        if (customEvent.detail.equippedTitle) {
          setLiveTitle(customEvent.detail.equippedTitle);
        }
        if (customEvent.detail.equippedInsignia) {
          setLiveInsignia(customEvent.detail.equippedInsignia);
        }
      }
    };

    window.addEventListener('arc-state-update', handleStateUpdate);
    return () => window.removeEventListener('arc-state-update', handleStateUpdate);
  }, []);

  const navItems = [
    { num: '01', name: 'YOUR ARC', href: '/dashboard', icon: Compass },
    { num: '02', name: 'QUESTS', href: '/quests', icon: Scroll },
    { num: '03', name: 'CHARACTER', href: '/character', icon: UserIcon },
    { num: '04', name: 'JOURNEY', href: '/journey', icon: MapPin },
    { num: '05', name: 'ARMORY', href: '/armory', icon: Shield },
  ];

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
    } catch {}
    window.location.href = '/';
  };

  const startFocusSession = (durationMinutes: number) => {
    setFocusModalOpen(false);
    router.push(`/focus/deep-work?duration=${durationMinutes}`);
  };

  return (
    <div className="min-h-screen bg-[#080C12] text-[#D7DDE4] font-sans antialiased selection:bg-[#C5A059]/25 selection:text-[#F2EEE6]">
      {/* ─────────────────────────────────────────────────────────────
          1. DESKTOP PERSISTENT LEFT SIDEBAR (240px)
      ───────────────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 w-60 bg-[#080C12] border-r border-[#1A222C] z-40 select-none"
        aria-label="Sidebar Navigation"
      >
        {/* Top: The ARC Brand & Emblem */}
        <div className="h-20 px-6 flex items-center gap-3 border-b border-[#141B24]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <CompassRose className="w-6 h-6 text-[#C5A059] transition-transform duration-500 group-hover:rotate-45" />
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sm tracking-[0.24em] text-[#F2EEE6] uppercase">
                The ARC
              </span>
              <span className="text-[9px] font-mono tracking-[0.16em] text-[#6B7784] uppercase">
                Life RPG
              </span>
            </div>
          </Link>
        </div>

        {/* Character RPG HUD Badge */}
        <div className="px-3 pt-3">
          <div className="px-3.5 py-3 rounded border border-[#1E2938] bg-gradient-to-b from-[#0C121B] to-[#080C12] shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[9px] tracking-[0.18em] text-[#C5A059] uppercase font-semibold truncate max-w-[120px]">
                {liveTitle}
              </span>
              <span className="flex items-center gap-1 font-mono text-[9px] text-[#EDE8DF]" title="Consecutive Day Streak">
                <Flame className="w-3 h-3 text-[#E65100]" />
                {liveStreak}d
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8B97A6]">
              <span className="truncate text-[8px] text-[#6B7784] uppercase tracking-wider max-w-[90px]" title="Equipped Insignia">
                {liveInsignia}
              </span>
              <Link
                href="/armory"
                className="text-[#C5A059] hover:text-[#D4B57A] transition-colors font-semibold flex items-center gap-1 text-[9px]"
                title="Sovereign Marks (Armory Currency)"
              >
                <Coins className="w-3 h-3 text-[#C5A059]" />
                <span>{liveMarks} MARKS</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navigation with subtle index numbering */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded transition-colors text-[11px] font-sans tracking-[0.16em] uppercase ${
                  isActive
                    ? 'bg-[#101722] text-[#F2EEE6] font-medium border-l-2 border-[#C5A059]'
                    : 'text-[#8B97A6] hover:text-[#EDE8DF] hover:bg-[#0D131C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[9px] ${isActive ? 'text-[#C5A059]' : 'text-[#4A5565]'}`}>
                    {item.num}
                  </span>
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Menu: Quick Focus Launcher, Settings, Sign Out */}
        <div className="p-3 border-t border-[#141B24] space-y-1">
          {/* Quick Focus Action */}
          <button
            type="button"
            onClick={() => setFocusModalOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-[11px] font-sans tracking-[0.16em] uppercase text-[#C5A059] hover:bg-[#C5A059]/10 transition-colors font-medium text-left cursor-pointer"
          >
            <Clock className="w-4 h-4 text-[#C5A059]" />
            <span>Focus Mode</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded text-[11px] font-sans tracking-[0.14em] uppercase text-[#6B7784] hover:text-[#C5A059] hover:bg-[#0D131C] transition-colors text-left cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {/* User Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded text-[11px] font-sans tracking-[0.14em] uppercase text-[#6B7784] hover:text-[#C5A059] hover:bg-[#0D131C] transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Status Header */}
      <header className="md:hidden sticky top-0 z-30 bg-[#080C12]/95 backdrop-blur-md border-b border-[#1A222C] px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <CompassRose className="w-5 h-5 text-[#C5A059]" />
          <span className="font-display font-semibold text-xs tracking-[0.2em] text-[#F2EEE6] uppercase">
            The ARC
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono text-[10px] text-[#EDE8DF]">
            <Flame className="w-3 h-3 text-[#E65100]" />
            {liveStreak}d
          </span>
          <Link
            href="/armory"
            className="flex items-center gap-1 font-mono text-[10px] text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded border border-[#C5A059]/30"
          >
            <Coins className="w-3 h-3 text-[#C5A059]" />
            <span>{liveMarks} M</span>
          </Link>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (Padded left on Desktop)
      ───────────────────────────────────────────────────────────── */}
      <main className="md:pl-60 min-h-screen pb-24 md:pb-12">
        {children}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. MOBILE BOTTOM NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080C12]/95 backdrop-blur-md border-t border-[#1A222C] px-2 py-2 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {[
          { name: 'ARC', href: '/dashboard', icon: Compass },
          { name: 'QUESTS', href: '/quests', icon: Scroll },
          { name: 'JOURNEY', href: '/journey', icon: MapPin },
          { name: 'CHARACTER', href: '/character', icon: UserIcon },
          { name: 'ARMORY', href: '/armory', icon: Shield },
        ].map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 text-[9px] font-sans tracking-[0.14em] uppercase transition-colors ${
                isActive ? 'text-[#C5A059] font-medium' : 'text-[#6B7784] hover:text-[#C9D0D8]'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          4. CALM FOCUS LAUNCHER MODAL
      ───────────────────────────────────────────────────────────── */}
      {focusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-[#0C1016] border border-[#243040] shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A222C] mb-6">
              <div className="flex items-center gap-2.5">
                <CompassRose className="w-5 h-5 text-[#C5A059]" />
                <span className="font-display text-sm tracking-[0.18em] uppercase text-[#F2EEE6] font-semibold">
                  Launch Focus Ritual
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFocusModalOpen(false)}
                className="text-[#6B7784] hover:text-[#F2EEE6] transition-colors p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="font-sans text-xs text-[#8B97A6] leading-relaxed mb-6 font-light">
              Enter an uninterrupted deep work ritual. Each completed minute increases Craft &amp; Momentum.
            </p>

            {/* Duration Selector */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[25, 45, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setFocusDuration(dur)}
                  className={`py-3 px-2 border text-center transition-all cursor-pointer ${
                    focusDuration === dur
                      ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#F2EEE6]'
                      : 'border-[#1E2938] text-[#8B97A6] hover:border-[#38485C]'
                  }`}
                >
                  <span className="block font-display text-xl font-semibold mb-0.5">{dur}</span>
                  <span className="block text-[9px] font-mono tracking-[0.14em] uppercase text-[#6B7784]">MINUTES</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFocusModalOpen(false)}
                className="px-5 py-2.5 text-[11px] font-sans tracking-[0.16em] uppercase text-[#7E8B99] hover:text-[#EDE8DF] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => startFocusSession(focusDuration)}
                className="px-6 py-2.5 text-[11px] font-sans tracking-[0.18em] uppercase text-[#080C12] bg-[#C5A059] hover:bg-[#D4B57A] transition-colors font-semibold shadow-[0_2px_12px_rgba(197,160,89,0.25)] cursor-pointer"
              >
                Begin Ritual &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. SETTINGS / PREFERENCES MODAL
      ───────────────────────────────────────────────────────────── */}
      {settingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full bg-[#0C1016] border border-[#243040] shadow-[0_25px_80px_rgba(0,0,0,0.95)] p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1A222C] mb-6">
              <span className="font-display text-sm tracking-[0.18em] uppercase text-[#F2EEE6] font-semibold">
                The ARC · System Preferences
              </span>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="text-[#6B7784] hover:text-[#F2EEE6] transition-colors p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-[#8B97A6]">
              <div className="flex items-center justify-between py-2 border-b border-[#141B24]">
                <span>Version</span>
                <span className="font-mono text-[#F2EEE6]">v4.2.0 Sovereign</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#141B24]">
                <span>Atmosphere</span>
                <span className="font-mono text-[#C5A059]">Obsidian Noir</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#141B24]">
                <span>Active Ledger</span>
                <span className="font-mono text-[#F2EEE6]">{userName}</span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setSettingsModalOpen(false)}
                className="px-6 py-2.5 text-[11px] font-sans tracking-[0.18em] uppercase text-[#080C12] bg-[#C5A059] hover:bg-[#D4B57A] transition-colors font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
