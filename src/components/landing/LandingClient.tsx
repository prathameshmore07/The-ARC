'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, X } from 'lucide-react';

/* Intricate 8-spoke celestial compass rose / star logo */
function CompassRose({ className = 'w-7 h-7 text-[#C5A059]' }: { className?: string }) {
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
      <polygon points="24,24 30,28 28,30" fill="currentColor" />
      <polygon points="76,24 70,28 72,30" fill="currentColor" />
      <polygon points="24,76 30,72 28,70" fill="currentColor" />
      <polygon points="76,76 70,72 72,70" fill="currentColor" />
    </svg>
  );
}

/* Feature 1: Open Book Icon */
function BookIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 4.5C2 3.67 2.67 3 3.5 3H10C11.1 3 12 3.9 12 5V19C12 18.17 11.33 17.5 10.5 17.5H3.5C2.67 17.5 2 18.17 2 19V4.5Z" />
      <path d="M22 4.5C22 3.67 21.33 3 20.5 3H14C12.9 3 12 3.9 12 5V19C12 18.17 12.67 17.5 13.5 17.5H20.5C21.33 17.5 22 18.17 22 19V4.5Z" />
      <line x1="6" y1="7" x2="9" y2="7" />
      <line x1="6" y1="10.5" x2="9" y2="10.5" />
      <line x1="15" y1="7" x2="18" y2="7" />
      <line x1="15" y1="10.5" x2="18" y2="10.5" />
    </svg>
  );
}

/* Feature 2: Stepped Bar Chart Icon */
function ProgressionIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="6" y1="20" x2="6" y2="15" />
      <line x1="11" y1="20" x2="11" y2="10" />
      <line x1="16" y1="20" x2="16" y2="5" />
      <line x1="3" y1="20" x2="19" y2="20" />
    </svg>
  );
}

/* Feature 4: Crossed Swords Icon */
function CrossedSwordsIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="4.5" y1="19.5" x2="19.5" y2="4.5" />
      <polyline points="15.5 4.5 19.5 4.5 19.5 8.5" />
      <line x1="3" y1="17" x2="7" y2="21" />
      <line x1="19.5" y1="19.5" x2="4.5" y2="4.5" />
      <polyline points="8.5 4.5 4.5 4.5 4.5 8.5" />
      <line x1="21" y1="17" x2="17" y2="21" />
    </svg>
  );
}

/* Path 1: Scholar Icon */
function ScholarIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <circle cx="12" cy="9" r="2" />
    </svg>
  );
}

/* Path 2: Warrior Barbell/Shield Icon */
function WarriorIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  );
}

/* Path 3: Artisan Leaf/Craft Icon */
function ArtisanIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

/* Path 4: Social Users/Fellowship Icon */
function SocialIcon({ className = 'w-5 h-5 text-[#B79A63]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* Social Media SVG Icons */
function DiscordIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function XIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function LandingClient() {
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const scrollToSection = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 64;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: id === 'hero' ? 0 : Math.max(0, elementPosition - navOffset),
        behavior: 'smooth',
      });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  useEffect(() => {
    const sectionIds = ['hero', 'lore', 'features', 'paths', 'journey'];
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c12] text-[#D7DDE4] selection:bg-[#B79A63]/30 selection:text-[#F4F1EA] font-sans antialiased overflow-x-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. GLOBAL DARK NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#080c12]/92 backdrop-blur-md border-b border-[#1A222C]/70">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <CompassRose className="w-5 h-5 text-[#B79A63] transition-transform duration-500 group-hover:rotate-45" />
            <span className="font-display text-[13px] tracking-[0.28em] text-[#E8E4DC] uppercase font-semibold">
              The ARC
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-9 text-[11px] font-sans tracking-[0.18em] uppercase text-[#8B97A6]">
            {[
              { id: 'hero', label: 'Home' },
              { id: 'lore', label: 'Lore' },
              { id: 'features', label: 'Features' },
              { id: 'paths', label: 'Paths' },
              { id: 'journey', label: 'Preview' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={scrollToSection(item.id)}
                className={`transition-colors cursor-pointer ${
                  activeSection === item.id
                    ? 'text-[#E8E4DC] hover:text-[#C4A46A]'
                    : 'hover:text-[#E8E4DC]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <span className="hidden lg:inline text-[10px] font-sans tracking-[0.22em] text-[#6B7784] uppercase">
              A More Disciplined You
            </span>
            <Link
              href="/login"
              className="px-5 py-2 text-[11px] font-sans tracking-[0.18em] uppercase text-[#0C1016] bg-[#C4A46A] hover:bg-[#D4B57A] transition-colors font-medium shadow-[0_2px_12px_rgba(196,164,106,0.25)]"
            >
              Enter The ARC &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO — CINEMATIC ESTABLISHING VISTA (Elden Ring / Diablo)
      ───────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-[96vh] sm:min-h-screen flex items-end overflow-hidden bg-[#080c12] scroll-mt-16">
        {/* Full-bleed panoramic environmental background */}
        <div className="absolute inset-0 z-0 select-none">
          <Image
            src="/images/hero_arc_cinematic.jpg"
            alt="The ARC — Dark Fantasy Mountain Citadel and Celestial Gateway"
            fill
            priority
            quality={95}
            className="object-cover object-center sm:object-[center_top]"
          />
          {/* Filmic ambient dark overlays for typography legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080c12]/92 via-[#080c12]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c12] via-transparent to-[#080c12]/50 pointer-events-none" />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 max-w-[1360px] w-full mx-auto px-6 pb-20 pt-36 flex flex-col justify-end min-h-[96vh]">
          <div className="max-w-[36rem]">
            <p className="font-sans text-[11px] tracking-[0.34em] text-[#B79A63] uppercase mb-4 font-semibold">
              Real life. Real progress.
            </p>
            <h1 className="font-display font-semibold text-[2.75rem] sm:text-6xl lg:text-[4.2rem] tracking-tight leading-[1.05] text-[#F2EEE6] mb-6 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] uppercase">
              Turn your<br />life into<br />your arc.
            </h1>
            <p className="text-sm sm:text-[15px] text-[#A6B2C0] leading-[1.75] mb-9 max-w-md font-sans font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Turn everyday goals into meaningful actions. Build habits, develop skills, and see your real-world progress become a journey.
            </p>

            <div className="flex items-center gap-5 flex-wrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3 bg-[#C4A46A] text-[#0C1016] font-sans text-[11px] tracking-[0.2em] uppercase hover:bg-[#D4B57A] transition-all font-semibold shadow-[0_4px_20px_rgba(196,164,106,0.3)]"
              >
                Enter The ARC &rarr;
              </Link>
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="inline-flex items-center gap-2.5 text-[11px] tracking-[0.2em] uppercase text-[#D5DCE5] hover:text-[#F2EEE6] transition-colors cursor-pointer py-3"
              >
                <Play className="w-3.5 h-3.5 text-[#B79A63] fill-[#B79A63]" />
                Watch how it works &rarr;
              </button>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-between text-[#6B7784] text-[9px] font-sans tracking-[0.3em] uppercase">
            <a
              href="#features"
              onClick={scrollToSection('features')}
              className="inline-flex items-center gap-3 hover:text-[#B79A63] transition-colors w-fit cursor-pointer"
            >
              <span>Scroll</span>
              <span className="block w-8 h-px bg-current" />
            </a>
            <span className="hidden sm:inline text-[#8B97A6]">
              Your actions shape your arc.
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. FEATURE STRIP (4 Dark Columns with Icons)
      ───────────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 border-y border-[#1A222C] bg-[#0A0E14] py-14 px-6 scroll-mt-16">
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {[
            {
              step: '01',
              icon: <BookIcon className="w-5 h-5 text-[#B79A63]" />,
              title: 'Set Your Goals',
              copy: 'Define what you want to improve.',
            },
            {
              step: '02',
              icon: <ProgressionIcon className="w-5 h-5 text-[#B79A63]" />,
              title: 'Make Your Moves',
              copy: 'Turn goals into concrete daily actions.',
            },
            {
              step: '03',
              icon: <CrossedSwordsIcon className="w-5 h-5 text-[#B79A63]" />,
              title: 'Build Your Attributes',
              copy: "Every action contributes to the areas you're developing.",
            },
            {
              step: '04',
              icon: <CompassRose className="w-5 h-5 text-[#B79A63]" />,
              title: 'See Your Arc',
              copy: 'Watch consistency become measurable progress.',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <div className="text-[#B79A63] mt-0.5">{item.icon}</div>
              <div>
                <span className="block font-mono text-[10px] tracking-[0.2em] text-[#B79A63] uppercase mb-1">
                  {item.step}
                </span>
                <h3 className="font-display text-lg text-[#EDE8DF] tracking-wide uppercase">
                  {item.title}
                </h3>
                <p className="font-sans text-sm text-[#7E8B99] mt-1 font-light">
                  {item.copy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. ABOUT / LORE — THE RELIC SANCTUARY
      ───────────────────────────────────────────────────────────── */}
      <section id="lore" className="relative z-10 py-24 lg:py-36 bg-[#080c12] overflow-hidden scroll-mt-16">
        <div className="max-w-[1360px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-20 items-center">
          {/* Left: Atmospheric Relic Chamber Artwork */}
          <div className="lg:col-span-7 relative rounded-lg overflow-hidden border border-[#232F40] shadow-[0_20px_60px_rgba(0,0,0,0.9)] aspect-[4/3] group">
            <Image
              src="/images/relic_sanctuary.jpg"
              alt="The ARC Relic Sanctuary Chamber"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c12] via-transparent to-transparent opacity-60" />
            
            {/* Embedded Runic Text Inscription Overlay */}
            <div className="absolute top-6 left-6 text-[10px] font-mono tracking-[0.24em] text-[#8EA2B8] uppercase">
              FOCUS BUILDS CLARITY
            </div>
            <div className="absolute top-6 right-6 text-[10px] font-mono tracking-[0.24em] text-[#8EA2B8] uppercase">
              CONSISTENCY BUILDS FREEDOM
            </div>
          </div>

          {/* Right: Lore Story */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <p className="font-sans text-[11px] tracking-[0.32em] text-[#B79A63] uppercase mb-3 font-semibold">
              What is The ARC?
            </p>
            <h2 className="font-display font-semibold text-4xl lg:text-5xl tracking-tight text-[#F2EEE6] mb-6 uppercase">
              Your life.<br />Played forward.
            </h2>
            <div className="font-sans text-[15px] text-[#93A1B2] leading-[1.8] mb-8 max-w-md font-light space-y-4">
              <p>
                The ARC turns the things you already want to do into a progression system.
              </p>
              <p>
                Set goals. Complete real-world actions. Build your abilities.
                Track your momentum and grow across the areas that matter.
              </p>
              <p>
                This isn&apos;t about escaping into a game.
              </p>
              <p>
                It&apos;s about making real life feel worth progressing through.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.22em] uppercase text-[#C4A46A] hover:text-[#E2C68A] transition-colors w-fit font-medium"
            >
              Explore the system &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CHOOSE YOUR PATH (4 Character Archetype Art Cards)
      ───────────────────────────────────────────────────────────── */}
      <section id="paths" className="relative z-10 py-24 lg:py-36 bg-[#0A0E14] border-t border-[#1A222C] scroll-mt-16">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="max-w-xl mb-16">
            <p className="font-sans text-[11px] tracking-[0.32em] text-[#B79A63] uppercase mb-3 font-semibold">
              Choose your path
            </p>
            <h2 className="font-display font-semibold text-3xl sm:text-5xl tracking-tight text-[#F2EEE6] mb-3 uppercase">
              One life.<br />Many ways to grow.
            </h2>
            <p className="font-sans text-sm text-[#7E8B99] font-light">
              Build the version of yourself you actually want to become.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              {
                title: 'The Scholar',
                image: '/images/path_scholar.jpg',
                Icon: ScholarIcon,
                motto: 'Knowledge. Focus. Curiosity.',
              },
              {
                title: 'The Warrior',
                image: '/images/path_warrior.jpg',
                Icon: WarriorIcon,
                motto: 'Strength. Discipline. Resilience.',
              },
              {
                title: 'The Artisan',
                image: '/images/path_artisan.jpg',
                Icon: ArtisanIcon,
                motto: 'Creativity. Skill. Craft.',
              },
              {
                title: 'The Social',
                image: '/images/path_social.jpg',
                Icon: SocialIcon,
                motto: 'Connection. Confidence. Community.',
              },
            ].map((p) => (
              <article
                key={p.title}
                className="relative rounded-lg overflow-hidden border border-[#1F2B3A] bg-[#070b10] group hover:border-[#B79A63]/60 transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.7)]"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070b10] via-[#070b10]/40 to-transparent pointer-events-none" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                    <p.Icon className="w-5 h-5 text-[#B79A63] mb-3" />
                    <h3 className="font-display text-2xl text-[#F2EEE6] mb-1 tracking-wide">
                      {p.title}
                    </h3>
                    <p className="font-sans text-xs text-[#8B97A6] font-light">
                      {p.motto}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. THE ANCIENT MANIFESTO TABLEAU
      ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 bg-[#080c12]">
        <div className="max-w-[1360px] mx-auto relative rounded-lg overflow-hidden border border-[#232F40] shadow-[0_20px_60px_rgba(0,0,0,0.9)] aspect-[16/6] sm:aspect-[16/5] flex items-center justify-center">
          <Image
            src="/images/manifesto_tableau.jpg"
            alt="The ARC Manifesto Tableau"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#080c12]/50 backdrop-blur-[1px]" />
          
          <div className="relative z-10 text-center px-6 max-w-2xl">
            <p className="font-display text-2xl sm:text-4xl text-[#F2EEE6] tracking-wide mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              &ldquo;A better version of you<br />is built one action at a time.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-mono tracking-[0.24em] text-[#B79A63] uppercase">
              <span>Discipline</span>
              <span>&middot;</span>
              <span>Momentum</span>
              <span>&middot;</span>
              <span>Growth</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. THE JOURNEY AWAITS / THE FINAL GATEWAY
      ───────────────────────────────────────────────────────────── */}
      <section id="journey" className="relative z-10 py-24 lg:py-36 bg-[#0A0E14] border-t border-[#1A222C] overflow-hidden scroll-mt-16">
        <div id="preview" className="scroll-mt-16" />
        <div className="max-w-[1360px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Final Call */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <p className="font-sans text-[11px] tracking-[0.32em] text-[#B79A63] uppercase mb-3 font-semibold">
              The journey awaits
            </p>
            <h2 className="font-display font-semibold text-4xl sm:text-5xl text-[#F2EEE6] mb-4 tracking-tight uppercase">
              Enter The ARC.
            </h2>
            <div className="font-sans text-sm text-[#8B97A6] leading-relaxed mb-8 font-light space-y-1">
              <p>Set the direction.</p>
              <p>Make the move.</p>
              <p>Build momentum.</p>
              <p>Become someone new.</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-7 py-3 bg-[#C4A46A] text-[#0C1016] font-sans text-[11px] tracking-[0.2em] uppercase hover:bg-[#D4B57A] transition-all w-fit font-semibold shadow-[0_4px_20px_rgba(196,164,106,0.3)]"
            >
              Enter The ARC &rarr;
            </Link>
          </div>

          {/* Center: Colossal Golden Celestial Portal Artwork */}
          <div className="lg:col-span-5 relative rounded-lg overflow-hidden border border-[#232F40] shadow-[0_20px_60px_rgba(0,0,0,0.9)] aspect-[4/3] group">
            <Image
              src="/images/final_gateway_portal.jpg"
              alt="The Final Celestial Gateway of The ARC"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-transparent to-transparent opacity-40" />
          </div>

          {/* Right: Progression Steps */}
          <div className="lg:col-span-3">
            <ol className="space-y-7 border-l border-[#243040] pl-6">
              {[
                { step: '01', title: 'Choose' },
                { step: '02', title: 'Act' },
                { step: '03', title: 'Grow' },
                { step: '04', title: 'Repeat' },
              ].map((item) => (
                <li key={item.step}>
                  <span className="block font-sans text-[10px] tracking-[0.22em] text-[#B79A63] uppercase mb-1 font-semibold">
                    {item.step}
                  </span>
                  <h4 className="font-display text-xl text-[#EDE8DF] tracking-wide uppercase">
                    {item.title}
                  </h4>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 bg-[#070a0f] border-t border-[#1A222C] py-12 px-6">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#6B7784]">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2.5">
              <CompassRose className="w-4 h-4 text-[#B79A63]" />
              <span className="font-display tracking-[0.22em] uppercase text-[#C9D0D8] font-medium">The ARC</span>
            </div>
            <span className="hidden sm:inline text-[#243040]">&middot;</span>
            <span className="font-sans text-[11px] text-[#7E8B99]">
              A life progression system for becoming who you want to be.
            </span>
          </div>
          <div className="flex items-center gap-6 font-sans text-[#7E8B99]">
            <a href="#hero" onClick={scrollToSection('hero')} className="hover:text-[#EDE8DF] transition-colors cursor-pointer">Home</a>
            <a href="#lore" onClick={scrollToSection('lore')} className="hover:text-[#EDE8DF] transition-colors cursor-pointer">Lore</a>
            <a href="#features" onClick={scrollToSection('features')} className="hover:text-[#EDE8DF] transition-colors cursor-pointer">Features</a>
            <a href="#paths" onClick={scrollToSection('paths')} className="hover:text-[#EDE8DF] transition-colors cursor-pointer">Paths</a>
            <a href="#journey" onClick={scrollToSection('journey')} className="hover:text-[#EDE8DF] transition-colors cursor-pointer">Preview</a>
          </div>
          <div className="flex items-center gap-4 text-[#7E8B99]">
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="hover:text-[#C4A46A] transition-colors"><DiscordIcon /></a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="hover:text-[#C4A46A] transition-colors"><XIcon /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-[#C4A46A] transition-colors"><InstagramIcon /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[#C4A46A] transition-colors"><YoutubeIcon /></a>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────────
          9. CINEMATIC TEASER MODAL
      ───────────────────────────────────────────────────────────── */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative max-w-3xl w-full bg-[#0C1016] border border-[#243040] shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A222C]">
              <div className="flex items-center gap-3">
                <CompassRose className="w-4 h-4 text-[#B79A63]" />
                <span className="font-display text-sm tracking-[0.16em] uppercase text-[#EDE8DF]">
                  The ARC · How It Works
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrailerOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#8B97A6] hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-[#080c12] flex items-center justify-center overflow-hidden p-8">
              <Image
                src="/images/final_gateway_portal.jpg"
                alt="Modal Background"
                fill
                className="object-cover opacity-25 pointer-events-none"
              />
              <div className="relative z-10 text-center px-6">
                <h4 className="font-display text-2xl sm:text-3xl text-[#F2EEE6] mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] uppercase">
                  Turn your life into your arc.
                </h4>
                <p className="font-sans text-sm text-[#8B97A6] max-w-md mx-auto mb-6 leading-relaxed font-light">
                  Turn everyday goals into meaningful actions. Build habits, develop skills, and see your real-world progress become a journey.
                </p>
                <Link
                  href="/login"
                  onClick={() => setTrailerOpen(false)}
                  className="inline-flex items-center px-7 py-3 bg-[#C4A46A] text-[#0C1016] font-sans text-[11px] tracking-[0.2em] uppercase font-semibold shadow-[0_4px_20px_rgba(196,164,106,0.3)]"
                >
                  Enter The ARC &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
