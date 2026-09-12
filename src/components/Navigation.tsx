'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, User, Shield, Skull, CheckCircle, Feather } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface NavigationProps {
  totalLevel?: number;
  totalXp?: number;
  grit?: number;
  hasActiveShadow?: boolean;
  activeShadowAttrId?: string | null;
}

export default function Navigation({
  totalLevel = 1,
  totalXp = 0,
  grit = 0,
  hasActiveShadow = false,
  activeShadowAttrId = null,
}: NavigationProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navLinks = [
    { name: 'Home', href: '/dashboard', icon: BookOpen },
    { name: 'Character', href: '/character', icon: User },
    { name: 'History', href: '/history', icon: CheckCircle },
    { name: 'Armory', href: '/armory', icon: Shield },
  ];

  return (
    <>
      {/* Desktop Persistent Top Bar */}
      <nav
        className="sticky top-0 z-40 w-full bg-[var(--ink-navy)]/95 backdrop-blur-md border-b border-[var(--page-bone-dim)]/15 select-none"
        aria-label="Main Navigation"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[var(--page-bone)] hover:text-[var(--brass)] transition-colors"
          >
            <Feather className="w-5 h-5 text-[var(--brass)]" aria-hidden="true" />
            <span className="font-serif font-bold text-lg tracking-tight">Entropy Engine</span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const isHome = link.name === 'Home';
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative py-1 transition-colors ${
                    isActive ? 'text-[var(--brass)] font-semibold' : 'text-[var(--page-bone-dim)] hover:text-[var(--page-bone)]'
                  }`}
                >
                  <span>{link.name}</span>
                  {/* Persistent Shadow dot on Home nav item if any Shadow is active */}
                  {isHome && hasActiveShadow && (
                    <span
                      className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-[var(--stain)] ring-2 ring-[var(--brass)]"
                      title="An active Shadow haunts your ledger"
                      aria-label="Active shadow alert"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Stats & Signout */}
          <div className="flex items-center gap-5">
            <div className="text-xs text-[var(--page-bone)]/80 flex items-center gap-2">
              <span className="font-serif font-bold text-[var(--brass)]">Lv {totalLevel}</span>
              <span className="text-[var(--page-bone-dim)]/40">·</span>
              <span>{totalXp} XP</span>
              <span className="text-[var(--page-bone-dim)]/40">·</span>
              <span className="font-semibold text-[var(--brass-bright)]">{grit} Grit</span>
            </div>

            <button
              onClick={handleSignOut}
              className="hidden sm:block text-xs text-[var(--page-bone-dim)]/60 hover:text-[var(--page-bone)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar (Section 3.14) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--ink-navy)]/95 backdrop-blur-md border-t border-[var(--page-bone-dim)]/15 px-2 py-1 select-none"
        aria-label="Mobile Navigation"
      >
        <div className="flex items-center justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 relative ${
              pathname === '/dashboard' ? 'text-[var(--brass)]' : 'text-[var(--page-bone-dim)]'
            }`}
            aria-label="Home Ledger"
          >
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
            {hasActiveShadow && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[var(--stain)] ring-1 ring-[var(--brass)]" />
            )}
          </Link>

          <Link
            href="/character"
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 ${
              pathname === '/character' ? 'text-[var(--brass)]' : 'text-[var(--page-bone-dim)]'
            }`}
            aria-label="Character Sheet"
          >
            <User className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] mt-0.5 font-medium">Character</span>
          </Link>

          {/* 4th Tab: Confront if Shadow exists, otherwise Calm All-Clear */}
          {hasActiveShadow && activeShadowAttrId ? (
            <Link
              href={`/attribute/${activeShadowAttrId}/confront`}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 text-[var(--stain)] ${
                pathname.includes('/confront') ? 'text-[var(--brass)]' : 'text-red-400'
              }`}
              aria-label="Confront Active Shadow"
            >
              <Skull className="w-5 h-5 animate-pulse" aria-hidden="true" />
              <span className="text-[10px] mt-0.5 font-bold">Confront</span>
            </Link>
          ) : (
            <div
              className="flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 text-[var(--page-bone-dim)]/40"
              aria-label="No shadows active"
            >
              <CheckCircle className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] mt-0.5 font-medium">Clear</span>
            </div>
          )}

          <Link
            href="/armory"
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] px-3 py-1 ${
              pathname === '/armory' ? 'text-[var(--brass)]' : 'text-[var(--page-bone-dim)]'
            }`}
            aria-label="Armory"
          >
            <Shield className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] mt-0.5 font-medium">Armory</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
