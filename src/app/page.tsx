import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import Link from 'next/link';
import { Feather, ArrowRight } from 'lucide-react';

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex flex-col justify-between selection:bg-[var(--brass)] selection:text-[var(--ink-navy)] overflow-hidden relative">
      {/* SVG Ink Stain with feTurbulence in Background */}
      <div className="absolute top-10 right-[-10%] md:right-[-5%] w-[650px] h-[650px] pointer-events-none opacity-20 z-0">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <filter id="ink-turb">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <path
            d="M80,180 C50,110 130,50 200,60 C280,70 340,120 330,200 C320,280 250,330 180,340 C100,350 40,260 80,180 Z"
            fill="var(--stain)"
            filter="url(#ink-turb)"
          />
        </svg>
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Feather className="w-5 h-5 text-[var(--brass)]" aria-hidden="true" />
          <span className="font-serif font-bold text-xl tracking-tight text-[var(--page-bone)]">
            Entropy Engine
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--page-bone-dim)] hover:text-[var(--page-bone)] transition-colors px-4 py-2 rounded-lg border border-[var(--page-bone-dim)]/20 hover:border-[var(--brass)]/50"
        >
          Sign In
        </Link>
      </header>

      {/* Main Hero Section */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 py-12 md:py-20 my-auto">
        <div className="max-w-2xl text-left">
          <h1 className="font-serif font-bold text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-[var(--page-bone)] mb-6">
            Your neglect has a Shadow.
          </h1>
          
          <p className="text-lg md:text-xl text-[var(--page-bone-dim)] leading-relaxed mb-10 max-w-xl">
            Every part of life you ignore grows stronger against you. Do the real thing. Watch it weaken. Take back what it took.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-base transition-all shadow-md active:scale-98"
            >
              <span>Enter the Engine</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-[var(--page-bone-dim)]/30 hover:border-[var(--brass)] text-[var(--page-bone)] font-medium text-base transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* 3-Step Strip (Plain text, no numbered badges, horizontal on desktop) */}
        <section
          id="how-it-works"
          className="mt-24 pt-12 border-t border-[var(--page-bone-dim)]/15 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
          aria-label="How Entropy Engine Works"
        >
          <div>
            <h2 className="font-serif font-bold text-xl text-[var(--brass)] mb-2">
              Neglect
            </h2>
            <p className="text-sm text-[var(--page-bone-dim)] leading-relaxed">
              When a life area goes unpracticed for 48 hours, entropy takes hold and the page begins to corrupt.
            </p>
          </div>

          <div>
            <h2 className="font-serif font-bold text-xl text-[var(--brass)] mb-2">
              A Shadow grows
            </h2>
            <p className="text-sm text-[var(--page-bone-dim)] leading-relaxed">
              An ink stain bleeds across your entry, spawning an entity that remembers your past baseline and taxes future grind by 20%.
            </p>
          </div>

          <div>
            <h2 className="font-serif font-bold text-xl text-[var(--brass)] mb-2">
              Reclaim it
            </h2>
            <p className="text-sm text-[var(--page-bone-dim)] leading-relaxed">
              Complete server-timed focus sessions to banish the Shadow, lift the stain, restore lost XP, and unlock your Scar badge.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 text-xs text-[var(--page-bone-dim)]/60 border-t border-[var(--page-bone-dim)]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>The Living Ledger · Built for Tech Zephyr 4.0</span>
        <span>A Life RPG by Google DeepMind Team</span>
      </footer>
    </div>
  );
}
