'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import AppShell from '@/components/shell/AppShell';
import EmptyState from '@/components/game/EmptyState';
import {
  Shield,
  Award,
  Sparkles,
  Check,
  Lock,
  Compass,
  Flame,
  Crown,
  Scroll,
  Coins,
  Eye,
  X,
} from 'lucide-react';

type ArmoryCategory = 'TITLES' | 'INSIGNIAS' | 'PATH MARKS' | 'THEMES';
type RarityTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface ArmoryItem {
  id: string;
  name: string;
  category: ArmoryCategory;
  requirement: string;
  progressText: string;
  progressPercent: number;
  unlocked: boolean;
  equipped?: boolean;
  description: string;
  price: number;
  iconName: 'builder' | 'consistent' | 'focused' | 'shipper' | 'ascetic' | 'compass' | 'aegis' | 'seal5k' | 'crown30' | 'obsidian' | 'citadel' | 'artisan' | 'scholar' | 'warrior';
  badgeImage: string;
  loreTitle: string;
  loreQuote: string;
  rarity: RarityTier;
}

const RARITY_THEMES: Record<RarityTier, { badge: string; border: string; glow: string }> = {
  COMMON: {
    badge: 'bg-[#1E2938]/60 text-[#94A3B8] border-[#33445C]',
    border: 'border-[#243042]',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.1)]',
  },
  UNCOMMON: {
    badge: 'bg-[#3A7F58]/20 text-[#4ADE80] border-[#3A7F58]/50',
    border: 'border-[#3A7F58]/40',
    glow: 'shadow-[0_0_20px_rgba(74,222,128,0.15)]',
  },
  RARE: {
    badge: 'bg-[#5B7C99]/20 text-[#7DD3FC] border-[#5B7C99]/50',
    border: 'border-[#5B7C99]/40',
    glow: 'shadow-[0_0_25px_rgba(125,211,252,0.2)]',
  },
  EPIC: {
    badge: 'bg-[#C5A059]/20 text-[#E2B678] border-[#C5A059]/50',
    border: 'border-[#C5A059]/40',
    glow: 'shadow-[0_0_30px_rgba(197,160,89,0.25)]',
  },
  LEGENDARY: {
    badge: 'bg-[#D04A26]/20 text-[#FCA5A5] border-[#D04A26]/50',
    border: 'border-[#D04A26]/40',
    glow: 'shadow-[0_0_35px_rgba(208,74,38,0.3)]',
  },
};

const ARMORY_ITEMS: ArmoryItem[] = [
  // TITLES
  {
    id: 't-builder',
    name: 'THE BUILDER',
    category: 'TITLES',
    requirement: 'Complete 25 CRAFT quests.',
    progressText: '25 / 25 CRAFT quests',
    progressPercent: 100,
    unlocked: true,
    equipped: true,
    price: 0,
    description: 'Forged by persistent output and tangible craftsmanship. You do not merely plan; you manifest.',
    iconName: 'builder',
    badgeImage: '/images/armory/badge_the_builder.jpg',
    loreTitle: 'The Sovereign Architect',
    loreQuote: 'To build is to enforce sovereign will against the formless void.',
    rarity: 'RARE',
  },
  {
    id: 't-consistent',
    name: 'THE CONSISTENT',
    category: 'TITLES',
    requirement: 'Maintain a 14-day activity streak.',
    progressText: '7 / 14 days',
    progressPercent: 50,
    unlocked: false,
    price: 60,
    description: 'Awarded when discipline ceases to require willpower and becomes autonomous second nature.',
    iconName: 'consistent',
    badgeImage: '/images/armory/badge_the_consistent.jpg',
    loreTitle: 'The Unyielding Cadence',
    loreQuote: 'Not flash, not fury — rhythm is what splits mountains.',
    rarity: 'EPIC',
  },
  {
    id: 't-scholar',
    name: 'THE SCHOLAR',
    category: 'TITLES',
    requirement: 'Complete 50 MIND quests.',
    progressText: '32 / 50 MIND quests',
    progressPercent: 64,
    unlocked: false,
    price: 75,
    description: 'A mind trained into sustained depth, completely insulated against digital distraction.',
    iconName: 'scholar',
    badgeImage: '/images/armory/badge_the_scholar.jpg',
    loreTitle: 'The Luminary Mind',
    loreQuote: 'Silence within, vast comprehension without.',
    rarity: 'EPIC',
  },
  {
    id: 't-shipper',
    name: 'THE SHIPPER',
    category: 'TITLES',
    requirement: 'Complete 10 project-based quests.',
    progressText: '6 / 10 quests',
    progressPercent: 60,
    unlocked: false,
    price: 100,
    description: 'The mark of closing the loop. You deliver ideas through reality into the public square.',
    iconName: 'shipper',
    badgeImage: '/images/armory/badge_the_shipper.jpg',
    loreTitle: 'The Delivery Horizon',
    loreQuote: 'Unreleased craft is a daydream. Shipped reality is sovereign power.',
    rarity: 'LEGENDARY',
  },
  {
    id: 't-ascetic',
    name: 'THE ASCETIC',
    category: 'TITLES',
    requirement: 'Reach Level 09 in Disciplined Focus.',
    progressText: 'Level 7 / 9',
    progressPercent: 77,
    unlocked: true,
    price: 50,
    description: 'Renounce trivial obligations to build monumental compounding momentum.',
    iconName: 'ascetic',
    badgeImage: '/images/armory/badge_the_ascetic.jpg',
    loreTitle: 'The Iron Crucible',
    loreQuote: 'Subtract the trivial until only undeniable power remains.',
    rarity: 'RARE',
  },

  // INSIGNIAS
  {
    id: 'i-compass',
    name: 'CELESTIAL COMPASS',
    category: 'INSIGNIAS',
    requirement: 'Log quests across all 4 capabilities in one week.',
    progressText: 'Completed',
    progressPercent: 100,
    unlocked: true,
    equipped: true,
    price: 0,
    description: 'An ancient directional emblem guiding daily actions toward the summit.',
    iconName: 'compass',
    badgeImage: '/images/armory/badge_celestial_compass.jpg',
    loreTitle: 'The Zenith Navigator',
    loreQuote: 'True north is found not by looking down, but by holding course through darkness.',
    rarity: 'UNCOMMON',
  },
  {
    id: 'i-aegis',
    name: 'AEGIS OF RESOLVE',
    category: 'INSIGNIAS',
    requirement: 'Complete 15 demanding physical endurance moves.',
    progressText: '15 / 15 moves',
    progressPercent: 100,
    unlocked: true,
    price: 40,
    description: 'A crest forged through early morning runs and bodily fortitude.',
    iconName: 'aegis',
    badgeImage: '/images/armory/badge_aegis_resolve.jpg',
    loreTitle: 'The Immovable Bastion',
    loreQuote: 'The body submits to sovereign discipline; fatigue becomes structural reinforcement.',
    rarity: 'RARE',
  },
  {
    id: 'i-seal-5k',
    name: 'SEAL OF THE 5K',
    category: 'INSIGNIAS',
    requirement: 'Log your first continuous 5 Kilometer run.',
    progressText: 'Completed',
    progressPercent: 100,
    unlocked: true,
    price: 50,
    description: 'Proof that bodily inertia has surrendered to sovereign will.',
    iconName: 'seal5k',
    badgeImage: '/images/armory/badge_seal_5k.jpg',
    loreTitle: 'The Pavement Mark',
    loreQuote: 'Five thousand paces of unbroken sovereignty over lethargy.',
    rarity: 'RARE',
  },
  {
    id: 'i-crown-30',
    name: 'CREST OF 30 DAYS',
    category: 'INSIGNIAS',
    requirement: 'Reach 30 days of active momentum.',
    progressText: '7 / 30 days',
    progressPercent: 23,
    unlocked: false,
    price: 120,
    description: 'The golden crest awarded when habit is permanently locked into identity.',
    iconName: 'crown30',
    badgeImage: '/images/armory/badge_crest_30_days.jpg',
    loreTitle: 'The Habit Sovereign',
    loreQuote: 'One lunar cycle of unbroken recurrence transforms habit into sovereign destiny.',
    rarity: 'LEGENDARY',
  },

  // PATH MARKS
  {
    id: 'pm-artisan',
    name: 'MARK OF THE ARTISAN',
    category: 'PATH MARKS',
    requirement: 'Accumulate 500 Craft points.',
    progressText: '500 / 500 points',
    progressPercent: 100,
    unlocked: true,
    equipped: true,
    price: 75,
    description: 'Emblem of creative mastery, software architecture, and tactile execution.',
    iconName: 'artisan',
    badgeImage: '/images/armory/badge_mark_artisan.jpg',
    loreTitle: 'The Tactile Guild',
    loreQuote: 'Where technique meets reverence, raw material turns into permanence.',
    rarity: 'EPIC',
  },
  {
    id: 'pm-scholar',
    name: 'MARK OF THE SCHOLAR',
    category: 'PATH MARKS',
    requirement: 'Accumulate 500 Mind points.',
    progressText: '420 / 500 points',
    progressPercent: 84,
    unlocked: true,
    price: 75,
    description: 'Emblem of deep inquiry, philosophical study, and cognitive rigor.',
    iconName: 'scholar',
    badgeImage: '/images/armory/badge_mark_scholar.jpg',
    loreTitle: 'The Arcane Archive',
    loreQuote: 'Knowledge without integration is dust; wisdom is embodied action.',
    rarity: 'EPIC',
  },
  {
    id: 'pm-warrior',
    name: 'MARK OF THE WARRIOR',
    category: 'PATH MARKS',
    requirement: 'Accumulate 500 Body points.',
    progressText: '310 / 500 points',
    progressPercent: 62,
    unlocked: false,
    price: 75,
    description: 'Emblem of physical fortitude, iron discipline, and resilient bodily vitality.',
    iconName: 'warrior',
    badgeImage: '/images/armory/badge_mark_warrior.jpg',
    loreTitle: 'The Bodily Vanguard',
    loreQuote: 'Strength is not a passive gift; it is a discipline you forge every dawn.',
    rarity: 'EPIC',
  },

  // THEMES
  {
    id: 'th-obsidian',
    name: 'OBSIDIAN NOIR',
    category: 'THEMES',
    requirement: 'Default sovereign environment of The ARC.',
    progressText: 'Active',
    progressPercent: 100,
    unlocked: true,
    equipped: true,
    price: 0,
    description: 'Deep midnight obsidian surfaces, antique gold filigree, and ivory typography.',
    iconName: 'obsidian',
    badgeImage: '/images/armory/badge_obsidian_noir.jpg',
    loreTitle: 'The Midnight Monolith',
    loreQuote: 'Cast in volcanic glass, where no distracting noise can penetrate.',
    rarity: 'COMMON',
  },
  {
    id: 'th-citadel',
    name: 'GOTHIC CITADEL',
    category: 'THEMES',
    requirement: 'Reach Level 10 (ESTABLISHED).',
    progressText: 'Level 7 / 10',
    progressPercent: 70,
    unlocked: false,
    price: 150,
    description: 'Volumetric starlight atmosphere and ancient stone cathedral textures.',
    iconName: 'citadel',
    badgeImage: '/images/armory/badge_gothic_citadel.jpg',
    loreTitle: 'The High Spire',
    loreQuote: 'Stone arches reaching into eternal cold starlight, impervious to modern trivia.',
    rarity: 'LEGENDARY',
  },
];

function ItemIcon({ name, unlocked }: { name: string; unlocked: boolean }) {
  const color = unlocked ? 'text-[#C5A059]' : 'text-[#4A5565]';
  switch (name) {
    case 'compass':
      return <Compass className={`w-4 h-4 ${color}`} />;
    case 'crown30':
      return <Crown className={`w-4 h-4 ${color}`} />;
    case 'artisan':
    case 'builder':
      return <Flame className={`w-4 h-4 ${color}`} />;
    case 'scholar':
    case 'focused':
      return <Scroll className={`w-4 h-4 ${color}`} />;
    default:
      return <Shield className={`w-4 h-4 ${color}`} />;
  }
}

export default function ArmoryPage() {
  const [activeCategory, setActiveCategory] = useState<ArmoryCategory | 'ALL'>('ALL');
  const [items, setItems] = useState<ArmoryItem[]>(ARMORY_ITEMS);
  const [marks, setMarks] = useState<number>(184);
  const [streak, setStreak] = useState<number>(7);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inspectedItem, setInspectedItem] = useState<ArmoryItem | null>(null);

  useEffect(() => {
    async function loadArmoryState() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (typeof json.user?.marks === 'number') {
            setMarks(json.user.marks);
          } else if (typeof json.user?.grit === 'number') {
            setMarks(json.user.grit);
          }
          if (typeof json.user?.streak === 'number') {
            setStreak(json.user.streak);
          }

          if (json.cosmetics?.owned && json.cosmetics.owned.length > 0) {
            setItems((prev) =>
              prev.map((item) => {
                const owned = json.cosmetics.owned.find(
                  (c: any) => c.itemId === item.id || c.item?.name === item.name
                );
                if (owned) {
                  return { ...item, unlocked: true, equipped: owned.equipped };
                }
                return item;
              })
            );
          }
        }
      } catch (e) {
        console.error('Failed to load armory state', e);
      }
    }
    loadArmoryState();
  }, []);

  // Keyboard shortcut: ESC to close inspection modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInspectedItem(null);
      }
    };
    if (inspectedItem) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedItem]);

  const handleUnlock = async (item: ArmoryItem) => {
    if (marks < item.price) {
      setFeedback(`Insufficient Marks (${marks}/${item.price}). Complete quests to forge more.`);
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const newMarks = marks - item.price;
    setMarks(newMarks);
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, unlocked: true } : i))
    );

    if (inspectedItem?.id === item.id) {
      setInspectedItem((prev) => (prev ? { ...prev, unlocked: true } : null));
    }

    setFeedback(`Forged ${item.name}. Added to your sovereign armory.`);
    setTimeout(() => setFeedback(null), 3500);

    window.dispatchEvent(
      new CustomEvent('arc-state-update', {
        detail: { marks: newMarks },
      })
    );

    try {
      await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
    } catch (e) {
      console.error('Offline shop purchase fallback', e);
    }
  };

  const handleEquip = async (item: ArmoryItem) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.category === item.category) {
          return { ...i, equipped: i.id === item.id };
        }
        return i;
      })
    );

    if (inspectedItem?.category === item.category) {
      setInspectedItem((prev) => (prev ? { ...prev, equipped: prev.id === item.id } : null));
    }

    setFeedback(`Equipped ${item.name} to sovereign profile.`);
    setTimeout(() => setFeedback(null), 3500);

    const updatePayload: Record<string, any> = {};
    if (item.category === 'TITLES') updatePayload.equippedTitle = item.name;
    if (item.category === 'INSIGNIAS') updatePayload.equippedInsignia = item.name;

    window.dispatchEvent(
      new CustomEvent('arc-state-update', {
        detail: updatePayload,
      })
    );

    try {
      await fetch('/api/shop/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
    } catch (e) {
      console.error('Offline shop equip fallback', e);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  const equippedTitle = items.find((i) => i.category === 'TITLES' && i.equipped)?.name || 'THE BUILDER';
  const equippedInsignia = items.find((i) => i.category === 'INSIGNIAS' && i.equipped)?.name || 'CELESTIAL COMPASS';

  return (
    <AppShell
      userMarks={marks}
      userStreak={streak}
      equippedTitle={equippedTitle}
      equippedInsignia={equippedInsignia}
    >
      <div className="max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-24">
        {/* Feedback Banner */}
        {feedback && (
          <div className="mb-6 p-4 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/50 text-xs font-mono text-[#F2EEE6] flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A059]" />
              <span>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[#8B97A6] hover:text-[#EDE8DF]"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            01. RELIC SANCTUARY HEADER TABLEAU
        ───────────────────────────────────────────────────────────── */}
        <section
          className="relative mb-12 rounded-lg overflow-hidden border border-[#1E2938] shadow-[0_20px_70px_rgba(0,0,0,0.9)] bg-[#0A0F16]"
          aria-label="Armory Sanctuary"
        >
          <div className="relative h-64 sm:h-72 w-full overflow-hidden">
            <Image
              src="/images/arc/arc-armory.jpg"
              alt="The Relic Sanctuary"
              fill
              priority
              className="object-cover object-center opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F16] via-[#0A0F16]/65 to-transparent" />
          </div>

          <div className="relative p-6 sm:p-10 -mt-24 sm:-mt-28 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <span className="px-2.5 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 font-mono text-[9px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block w-max mb-2">
                EARNED HONORS &amp; REWARD ECONOMY
              </span>
              <h1 className="font-display font-semibold text-4xl sm:text-6xl text-[#F2EEE6] tracking-tight uppercase">
                The Armory
              </h1>
              <p className="font-sans text-xs sm:text-sm text-[#A6B2C0] font-light max-w-lg mt-1 leading-relaxed">
                Look at everything you have earned. Heraldic medallions, titles, and sovereign marks are not bought with real currency — they are forged through verified discipline.
              </p>
            </div>

            {/* Live Marks Balance Display */}
            <div className="p-4 rounded bg-[#080C12]/90 backdrop-blur-sm border border-[#1A2534] text-left sm:text-right shrink-0">
              <span className="font-mono text-[9px] text-[#8B97A6] uppercase tracking-widest block mb-1">
                AVAILABLE TREASURY
              </span>
              <div className="flex items-center sm:justify-end gap-2 text-3xl sm:text-4xl font-display font-bold text-[#C5A059]">
                <Coins className="w-7 h-7 text-[#C5A059]" />
                <span>{marks}</span>
              </div>
              <span className="font-mono text-[10px] text-[#6B7784] uppercase block mt-1">
                SOVEREIGN MARKS
              </span>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            02. FILTER TABS (TITLES, INSIGNIAS, PATH MARKS, THEMES)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-[#141B24] pb-4 mb-8 overflow-x-auto">
          {(['ALL', 'TITLES', 'INSIGNIAS', 'PATH MARKS', 'THEMES'] as const).map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded font-mono text-xs uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#C5A059] text-[#080C12] font-semibold shadow-md'
                    : 'bg-[#0A0E14] text-[#8B97A6] hover:text-[#EDE8DF] border border-[#1A222C]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            03. ITEMS GRID (HERALDIC 3D RELIEF MEDALLIONS)
        ───────────────────────────────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <EmptyState type="armory" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const isLocked = !item.unlocked;
              const isEquipped = item.equipped;
              const rarityStyle = RARITY_THEMES[item.rarity];

              return (
                <div
                  key={item.id}
                  className={`group rounded-xl border p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                    isEquipped
                      ? 'border-[#C5A059] bg-gradient-to-b from-[#111927] to-[#0A0F16] shadow-[0_8px_35px_rgba(197,160,89,0.2)] ring-1 ring-[#C5A059]/60'
                      : item.unlocked
                      ? 'border-[#1E2938] bg-[#0A0E14] hover:border-[#C5A059]/50 hover:bg-[#0D141F]'
                      : 'border-[#141B24] bg-[#070A0F]/70 opacity-80 hover:opacity-100 hover:border-[#223040]'
                  }`}
                >
                  {/* Subtle Background Glow for Equipped */}
                  {isEquipped && (
                    <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none" />
                  )}

                  <div>
                    {/* Top Row: Rarity Tag + Category + Status Pill */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded border uppercase tracking-wider ${rarityStyle.badge}`}>
                          {item.rarity}
                        </span>
                        <span className="font-mono text-[9px] text-[#6B7784] tracking-widest uppercase">
                          {item.category}
                        </span>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded bg-[#C5A059] text-[#080C12] uppercase font-bold shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>EQUIPPED</span>
                          </span>
                        ) : item.unlocked ? (
                          <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#3A7F58]/20 border border-[#3A7F58]/40 text-[#4ADE80] uppercase font-semibold">
                            OWNED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded bg-[#141C26] border border-[#1E2938] text-[#7E8B99] uppercase">
                            <Lock className="w-3 h-3" />
                            <span>LOCKED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        3D HERALDIC MEDALLION SHOWCASE (CLICKABLE TO INSPECT)
                    ───────────────────────────────────────────────────────────── */}
                    <div
                      onClick={() => setInspectedItem(item)}
                      className="relative my-4 flex flex-col items-center justify-center cursor-pointer group/medallion"
                      title="Click to inspect 3D medallion and lore in detail"
                    >
                      {/* Radiant Aura Glow */}
                      {isEquipped && (
                        <div className="absolute w-36 h-36 rounded-full bg-[#C5A059]/25 blur-xl pointer-events-none animate-pulse" />
                      )}
                      {item.unlocked && !isEquipped && (
                        <div className="absolute w-32 h-32 rounded-full bg-[#C5A059]/10 blur-lg pointer-events-none group-hover/medallion:bg-[#C5A059]/20 transition-all" />
                      )}

                      {/* 3D Circular Medallion Frame */}
                      <div
                        className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 transition-all duration-300 shadow-2xl ${
                          isEquipped
                            ? 'bg-gradient-to-b from-[#FFF2CC] via-[#C5A059] to-[#8C6D38] shadow-[0_0_30px_rgba(197,160,89,0.35)] scale-105'
                            : item.unlocked
                            ? 'bg-gradient-to-b from-[#C5A059]/70 via-[#4A3B20] to-[#161F2A] group-hover/medallion:from-[#C5A059] group-hover/medallion:scale-105'
                            : 'bg-gradient-to-b from-[#243042]/70 via-[#151E2A] to-[#0B0F14] opacity-70 group-hover/medallion:opacity-90'
                        }`}
                      >
                        <div className="relative w-full h-full rounded-full overflow-hidden bg-[#0A0F16] border border-[#06090E]">
                          <Image
                            src={item.badgeImage}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 112px, 128px"
                            className={`object-cover transition-all duration-500 ${
                              isLocked
                                ? 'grayscale contrast-125 opacity-35'
                                : 'contrast-105 group-hover/medallion:scale-110'
                            }`}
                          />

                          {/* Locked State Frosted Shield Overlay */}
                          {isLocked && (
                            <div className="absolute inset-0 bg-[#070A0F]/65 backdrop-blur-[1px] flex flex-col items-center justify-center text-[#8B97A6]">
                              <div className="w-8 h-8 rounded-full bg-[#080C12]/90 border border-[#243042] flex items-center justify-center shadow-md">
                                <Lock className="w-4 h-4 text-[#8B97A6]" />
                              </div>
                            </div>
                          )}

                          {/* Hover Inspect Indicator */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/medallion:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#F7F5F0] bg-[#0A0F16]/90 px-2 py-0.5 rounded border border-[#C5A059]/60 flex items-center gap-1 shadow-lg">
                              <Eye className="w-3 h-3 text-[#C5A059]" />
                              <span>Inspect</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Small Quick-Inspect Pill below badge */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedItem(item);
                        }}
                        className="mt-2.5 inline-flex items-center gap-1 font-mono text-[9px] text-[#8B97A6] hover:text-[#C5A059] uppercase tracking-wider transition-colors"
                      >
                        <Eye className="w-3 h-3 text-[#C5A059]" />
                        <span>Inspect Lore &amp; Art</span>
                      </button>
                    </div>

                    {/* Badge Title and Lore Subline */}
                    <div className="text-center sm:text-left mb-2">
                      <h3 className="font-display font-semibold text-lg sm:text-xl text-[#F2EEE6] tracking-wide uppercase">
                        {item.name}
                      </h3>
                      <span className="font-mono text-[10px] text-[#C5A059] uppercase tracking-wider block mt-0.5">
                        {item.loreTitle}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-[#8B97A6] font-light leading-relaxed mb-4 text-center sm:text-left line-clamp-2">
                      {item.description}
                    </p>

                    {/* Unlock Condition & Real Progress */}
                    <div className="p-3 rounded bg-[#080C12] border border-[#141C26] mb-5">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                        <span className="text-[#8B97A6] uppercase">REQUIREMENT</span>
                        <span className={item.unlocked ? 'text-[#4ADE80] font-semibold' : 'text-[#C5A059]'}>
                          {item.progressText}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-[#EDE8DF] font-light mb-2">
                        {item.requirement}
                      </p>
                      <div className="w-full h-1 bg-[#141C26] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            item.unlocked ? 'bg-[#3A7F58]' : 'bg-[#C5A059]'
                          }`}
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions: Locked -> Purchase -> Equip Loop */}
                  <div>
                    {isEquipped ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-2.5 rounded bg-[#C5A059]/20 border border-[#C5A059]/50 text-xs font-mono text-[#C5A059] uppercase tracking-wider font-semibold cursor-default flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Equipped to Profile</span>
                      </button>
                    ) : item.unlocked ? (
                      <button
                        type="button"
                        onClick={() => handleEquip(item)}
                        className="w-full py-2.5 rounded bg-[#121B26] hover:bg-[#182332] text-xs font-mono text-[#EDE8DF] hover:text-[#C5A059] uppercase tracking-wider transition-colors border border-[#243040] hover:border-[#C5A059] cursor-pointer"
                      >
                        Equip to Profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUnlock(item)}
                        className={`w-full py-2.5 rounded text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          marks >= item.price
                            ? 'bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-semibold shadow-md'
                            : 'bg-[#141C26] text-[#6B7784] border border-[#1E2938]'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Forge · {item.price} Marks</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            04. FULL RESOLUTION BADGE INSPECT MODAL
        ───────────────────────────────────────────────────────────── */}
        {inspectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
            onClick={() => setInspectedItem(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full rounded-xl border border-[#C5A059]/70 bg-gradient-to-b from-[#0F1622] via-[#0A0F16] to-[#06090E] p-6 sm:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setInspectedItem(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-[#080C12] border border-[#1E2938] text-[#8B97A6] hover:text-[#EDE8DF] hover:border-[#C5A059] transition-colors cursor-pointer z-20"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Large Medallion Display */}
                <div className="relative shrink-0 flex items-center justify-center">
                  {/* Radiant Aura Glow */}
                  <div
                    className={`absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full blur-2xl pointer-events-none transition-all ${
                      inspectedItem.equipped
                        ? 'bg-[#C5A059]/35 animate-pulse'
                        : inspectedItem.unlocked
                        ? 'bg-[#C5A059]/20'
                        : 'bg-[#1E2938]/30'
                    }`}
                  />

                  {/* Circular 3D Medallion Rim */}
                  <div
                    className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-2.5 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.9)] ${
                      inspectedItem.equipped
                        ? 'bg-gradient-to-b from-[#FFF4D0] via-[#C5A059] to-[#684C21] ring-2 ring-[#C5A059]/60'
                        : inspectedItem.unlocked
                        ? 'bg-gradient-to-b from-[#C5A059] via-[#735A2B] to-[#151E2A]'
                        : 'bg-gradient-to-b from-[#33445C] via-[#1E2938] to-[#0A0F16]'
                    }`}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-[#06090E] border-2 border-[#0B0F14]">
                      <Image
                        src={inspectedItem.badgeImage}
                        alt={inspectedItem.name}
                        fill
                        sizes="(max-width: 640px) 192px, 224px"
                        priority
                        className={`object-cover ${
                          !inspectedItem.unlocked ? 'grayscale contrast-125 opacity-40' : ''
                        }`}
                      />
                      {!inspectedItem.unlocked && (
                        <div className="absolute inset-0 bg-[#070A0F]/65 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-[#080C12]/95 border border-[#33445C] flex items-center justify-center shadow-lg">
                            <Lock className="w-6 h-6 text-[#94A3B8]" />
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#94A3B8]">
                            LOCKED RELIC
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lore Dossier Details */}
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/40 font-mono text-[9px] tracking-[0.2em] text-[#C5A059] uppercase font-semibold">
                      {inspectedItem.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] tracking-widest uppercase border ${
                        RARITY_THEMES[inspectedItem.rarity]?.badge
                      }`}
                    >
                      {inspectedItem.rarity}
                    </span>
                    {inspectedItem.equipped ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded bg-[#C5A059] text-[#080C12] uppercase font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>EQUIPPED</span>
                      </span>
                    ) : inspectedItem.unlocked ? (
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[#3A7F58]/20 border border-[#3A7F58]/40 text-[#4ADE80] uppercase font-semibold">
                        OWNED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded bg-[#141C26] border border-[#1E2938] text-[#7E8B99] uppercase">
                        <Lock className="w-3 h-3" />
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#F2EEE6] tracking-wide uppercase">
                    {inspectedItem.name}
                  </h2>
                  <span className="block font-mono text-xs text-[#C5A059] uppercase tracking-wider mt-0.5 mb-3">
                    {inspectedItem.loreTitle}
                  </span>

                  <blockquote className="border-l-2 border-[#C5A059]/50 pl-3 my-3 text-xs sm:text-sm font-editorial italic text-[#EDE8DF]/90 leading-relaxed">
                    &ldquo;{inspectedItem.loreQuote}&rdquo;
                  </blockquote>

                  <p className="font-sans text-xs text-[#A6B2C0] font-light leading-relaxed mb-4">
                    {inspectedItem.description}
                  </p>

                  {/* Requirement Progress */}
                  <div className="p-3 rounded bg-[#080C12] border border-[#1A2534] mb-5">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                      <span className="text-[#8B97A6] uppercase">REQUIREMENT</span>
                      <span
                        className={
                          inspectedItem.unlocked ? 'text-[#4ADE80] font-semibold' : 'text-[#C5A059]'
                        }
                      >
                        {inspectedItem.progressText}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-[#EDE8DF] font-light mb-2">
                      {inspectedItem.requirement}
                    </p>
                    <div className="w-full h-1.5 bg-[#141C26] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          inspectedItem.unlocked ? 'bg-[#3A7F58]' : 'bg-[#C5A059]'
                        }`}
                        style={{ width: `${inspectedItem.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Modal Action Buttons */}
                  <div>
                    {inspectedItem.equipped ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 rounded bg-[#C5A059]/20 border border-[#C5A059]/50 text-xs font-mono text-[#C5A059] uppercase tracking-wider font-semibold cursor-default flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Equipped to Sovereign Profile</span>
                      </button>
                    ) : inspectedItem.unlocked ? (
                      <button
                        type="button"
                        onClick={() => handleEquip(inspectedItem)}
                        className="w-full py-3 rounded bg-[#C5A059] hover:bg-[#D4B57A] text-xs font-mono text-[#080C12] uppercase tracking-wider font-bold transition-all shadow-lg cursor-pointer"
                      >
                        Equip to Profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUnlock(inspectedItem)}
                        className={`w-full py-3 rounded text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          marks >= inspectedItem.price
                            ? 'bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] font-bold shadow-lg'
                            : 'bg-[#141C26] text-[#6B7784] border border-[#1E2938]'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        <span>Forge Relic · {inspectedItem.price} Marks</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
