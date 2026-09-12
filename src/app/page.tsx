import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import Link from 'next/link';
import { Sparkles, ArrowRight, Brain, Dumbbell, Palette, Shield, Flame } from 'lucide-react';

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect('/dashboard');
  }

  const archetypes = [
    {
      title: 'The Scholar',
      stat: 'Intellect',
      icon: Brain,
      color: 'text-sky-400',
      border: 'border-sky-500/30',
      bgGlow: 'from-sky-500/10',
      description: 'Forges mental acuity through deep work, system architecture, and unrelenting research.',
      perk: '+15% XP on 50m+ deep focus blocks',
    },
    {
      title: 'The Vanguard',
      stat: 'Strength',
      icon: Dumbbell,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bgGlow: 'from-amber-500/10',
      description: 'Hammers physical endurance and routine. Stands resilient against bodily atrophy and inertia.',
      perk: 'Halves decay speed on physical disciplines',
    },
    {
      title: 'The Artisan',
      stat: 'Creativity & Focus',
      icon: Palette,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bgGlow: 'from-emerald-500/10',
      description: 'Channels continuous momentum into tangible relics, shipped modules, and polished craft.',
      perk: 'Unlocks rare cosmetic drops upon quest streaks',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col justify-between selection:bg-[var(--accent-slate)] selection:text-white relative overflow-hidden">
      {/* Cinematic Dark Fantasy Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-[var(--bg-surface-2)]/60 via-[var(--bg-surface-1)]/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-[var(--border-subtle)]/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[var(--accent-amber)]" aria-hidden="true" />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-[var(--text-headline)]">
            Entropy Engine
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-dim)] hover:text-[var(--text-headline)] transition-colors px-4 py-2 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--bg-surface-1)]"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-[var(--bg-base)] bg-[var(--accent-amber)] hover:bg-amber-300 transition-colors px-4 py-2 rounded-lg"
          >
            Begin
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl w-full mx-auto px-6 pt-16 pb-20 my-auto">
        <div className="max-w-3xl text-left">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] text-xs text-[var(--accent-amber)] mb-6 shadow-rpg-sm">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
            <span>Tech Zephyr 4.0 · Life RPG Engine</span>
          </div>

          <h1 className="font-serif font-bold text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-[var(--text-headline)] mb-6">
            Defend your progress against the inevitable.
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-dim)] leading-relaxed mb-10 max-w-2xl font-sans">
            A Life RPG where your stats don&apos;t just grow — they decay if neglected, spawning living Shadows that steal your future grind. Complete quests to weaken them. Strike to reclaim what was lost.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[var(--accent-slate)] hover:bg-slate-500 text-white font-serif font-bold text-base transition-all shadow-rpg-md hover:shadow-rpg-glow active:scale-98"
            >
              <span>Enter the Engine</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <a
              href="#lore"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-hover)] bg-[var(--bg-surface-1)] hover:bg-[var(--bg-surface-2)] text-[var(--text-headline)] font-medium text-base transition-colors"
            >
              Explore Archetypes
            </a>
          </div>
        </div>

        {/* Lore Strip Under the Fold */}
        <section
          id="lore"
          className="mt-20 pt-10 border-t border-[var(--border-subtle)]/80 grid grid-cols-1 md:grid-cols-3 gap-6"
          aria-label="World Mechanics"
        >
          <div className="p-5 rounded-xl bg-[var(--bg-surface-1)]/60 border border-[var(--border-subtle)]">
            <div className="text-xs uppercase tracking-wider text-[var(--accent-amber)] font-semibold mb-1">Principle I</div>
            <h2 className="font-serif font-bold text-lg text-[var(--text-headline)] mb-2">Tasks Forge Stats</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              Every completed module feeds your core disciplines. Real grind builds tangible in-game power.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-1)]/60 border border-[var(--border-subtle)]">
            <div className="text-xs uppercase tracking-wider text-orange-400 font-semibold mb-1">Principle II</div>
            <h2 className="font-serif font-bold text-lg text-[var(--text-headline)] mb-2">Streaks Summon Buffs</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              Consecutive discipline ignites a streak flame, unlocking 48-hour XP multipliers and damage amplifiers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-surface-1)]/60 border border-[var(--border-subtle)]">
            <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">Principle III</div>
            <h2 className="font-serif font-bold text-lg text-[var(--text-headline)] mb-2">Completion Drops Relics</h2>
            <p className="text-sm text-[var(--text-dim)] leading-relaxed">
              Slaying high-entropy bosses earns Gold and soulbound relics from the Armory to customize your chronicle.
            </p>
          </div>
        </section>

        {/* Character Archetypes Showcase Row */}
        <section className="mt-16" aria-label="Character Archetypes">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif font-bold text-2xl text-[var(--text-headline)]">Discipline Archetypes</h2>
              <p className="text-sm text-[var(--text-dim)]">Visual anchors for your real-world progress tracking.</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
              <Shield className="w-3.5 h-3.5" />
              <span>Soulbound progression</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {archetypes.map((arch) => {
              const Icon = arch.icon;
              return (
                <div
                  key={arch.title}
                  className={`p-6 rounded-xl bg-[var(--bg-surface-1)] border ${arch.border} bg-gradient-to-b ${arch.bgGlow} to-transparent shadow-rpg-sm hover:shadow-rpg-md transition-all flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${arch.color}`} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-[var(--text-dim)]">
                        {arch.stat}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-xl text-[var(--text-headline)] mb-2">
                      {arch.title}
                    </h3>
                    <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-4">
                      {arch.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[var(--border-subtle)]/60 text-xs font-medium text-[var(--text-body)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                    <span>{arch.perk}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 border-t border-[var(--border-subtle)] text-xs text-[var(--text-faint)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Entropy Engine · Tech Zephyr 4.0 Life RPG</span>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-[var(--text-headline)] transition-colors">
            Demo Login
          </Link>
          <Link href="/signup" className="hover:text-[var(--text-headline)] transition-colors">
            Create Profile
          </Link>
        </div>
      </footer>
    </div>
  );
}
