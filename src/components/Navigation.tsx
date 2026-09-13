'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scroll, Swords, User, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface NavigationProps {
  totalLevel?: number;
  totalXp?: number;
  grit?: number;
  hasActiveShadow?: boolean;
  activeShadowAttrId?: string | null;
  streakDays?: number;
}

export default function Navigation({
  totalLevel = 1,
  totalXp = 0,
  grit = 0,
  hasActiveShadow = false,
  activeShadowAttrId = null,
  streakDays = 5,
}: NavigationProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  // In Focus Mode, hide non-essential navigation for full immersion (WANDR & RuneScape guidance)
  if (pathname.startsWith('/focus/')) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
    } catch {}
    window.location.href = '/login';
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quests', href: '/history', icon: Scroll },
    {
      name: 'Focus',
      href: activeShadowAttrId ? `/attribute/${activeShadowAttrId}/confront` : '/dashboard',
      icon: Swords,
      hasAlert: hasActiveShadow,
    },
    { name: 'Character', href: '/character', icon: User },
    { name: 'Shop', href: '/armory', icon: ShoppingBag },
  ];

  return (
    <>
      {/* Desktop Persistent Top Bar */}
      <nav
        className="sticky top-0 z-40 w-full bg-[var(--bg-surface-1)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-rpg-sm select-none"
        aria-label="Main Navigation"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Metaphor */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-[var(--text-headline)] hover:text-[var(--accent-amber)] transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:border-[var(--accent-amber)] transition-colors">
              <Sparkles className="w-4 h-4 text-[var(--accent-amber)]" aria-hidden="true" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">The ARC</span>
          </Link>

          {/* Center Links (5 Core Items) */}
          <div className="hidden md:flex items-center space-x-7 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative py-1 flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'text-[var(--accent-amber)] font-semibold'
                      : 'text-[var(--text-dim)] hover:text-[var(--text-headline)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                  {link.hasAlert && (
                    <span
                      className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[var(--accent-brick)] ring-2 ring-[var(--accent-amber)] animate-pulse"
                      title="Shadow stalker active"
                      aria-label="Shadow active"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Stats: Streak Flame + Level + Grit + Signout */}
          <div className="flex items-center gap-4">
            {/* Streak Flame */}
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-xs"
              title={`${streakDays}-day streak active`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
              <span className="font-bold text-orange-400">{streakDays}d</span>
            </div>

            {/* Level & Currency */}
            <div className="text-xs text-[var(--text-dim)] flex items-center gap-2">
              <span className="font-serif font-bold text-[var(--accent-amber)]">Lv {totalLevel}</span>
              <span className="text-[var(--border-subtle)]">·</span>
              <span className="font-semibold text-amber-200">{grit} Gold</span>
            </div>

            <button
              onClick={handleSignOut}
              className="hidden sm:block text-xs text-[var(--text-faint)] hover:text-[var(--text-body)] transition-colors ml-1"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar (5 items max, 44x44pt minimum tap target) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface-1)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] px-2 py-1 select-none shadow-rpg-md"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-2 py-1 relative ${
                  isActive ? 'text-[var(--accent-amber)] font-semibold' : 'text-[var(--text-dim)] hover:text-[var(--text-body)]'
                }`}
                aria-label={link.name}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] mt-0.5">{link.name}</span>
                {link.hasAlert && (
                  <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[var(--accent-brick)] ring-1 ring-[var(--accent-amber)] animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
