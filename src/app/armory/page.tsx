'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Shield, Sparkles, Check, Lock, Coins, Palette, Award, Gem, Flame } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  type: 'theme' | 'badge' | 'relic';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  price: number;
  description: string;
  isSoulbound: boolean;
  effect: string;
}

export default function ArmoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'themes' | 'badges' | 'relics'>('themes');
  const [purchasing, setPurchasing] = useState(false);
  const [equippedIds, setEquippedIds] = useState<string[]>(['item_obsidian_cover', 'badge_novice']);

  const catalogItems: ShopItem[] = [
    // Themes Tab
    {
      id: 'item_obsidian_cover',
      name: 'Obsidian Ledger Cover',
      type: 'theme',
      rarity: 'rare',
      price: 50,
      description: 'Deep ink-treated leather binding forged to withstand creeping decay.',
      isSoulbound: true,
      effect: 'Custom dark chronicle frame',
    },
    {
      id: 'item_vellum_parchment',
      name: 'Weathered Vellum Skin',
      type: 'theme',
      rarity: 'uncommon',
      price: 30,
      description: 'Ancient archival paper with warm gold filigree borders.',
      isSoulbound: false,
      effect: 'Warm parchment UI variant',
    },
    {
      id: 'item_abyssal_frame',
      name: 'Abyssal Void Theme',
      type: 'theme',
      rarity: 'epic',
      price: 120,
      description: 'Forged from the remnants of banished shadows. Pulses with dark energy.',
      isSoulbound: true,
      effect: 'Crimson shadow aura around cards',
    },
    // Badges Tab
    {
      id: 'badge_novice',
      name: 'Initiate Chronicler',
      type: 'badge',
      rarity: 'common',
      price: 0,
      description: 'Awarded upon inscribing your first discipline in the ledger.',
      isSoulbound: true,
      effect: 'Display title on profile',
    },
    {
      id: 'badge_vanguard',
      name: 'Vanguard of Discipline',
      type: 'badge',
      rarity: 'rare',
      price: 75,
      description: 'Testament to 7 consecutive days of unbroken discipline.',
      isSoulbound: true,
      effect: 'Streak flame glow multiplier',
    },
    {
      id: 'badge_shadow_bane',
      name: 'Shadowbane Seal',
      type: 'badge',
      rarity: 'epic',
      price: 150,
      description: 'Earned by defeating an active Shadow and reclaiming all stolen XP.',
      isSoulbound: true,
      effect: '+5% damage on focus strikes',
    },
    // Relics Tab
    {
      id: 'relic_chrono_hourglass',
      name: 'Hourglass of the Void',
      type: 'relic',
      rarity: 'legendary',
      price: 300,
      description: 'Slows the onset of stat decay by 12 hours across all disciplines.',
      isSoulbound: true,
      effect: '-12h decay timer buffer',
    },
    {
      id: 'relic_quill_resolve',
      name: 'Quill of Battle Resolve',
      type: 'relic',
      rarity: 'epic',
      price: 180,
      description: 'Increases XP banked during 25m+ deep focus sessions by 15%.',
      isSoulbound: true,
      effect: '+15% deep work XP bonus',
    },
    {
      id: 'relic_first_scar',
      name: 'Scar of the First Void',
      type: 'relic',
      rarity: 'uncommon',
      price: 40,
      description: 'An indelible etching awarded to survivors of early entropy corruption.',
      isSoulbound: true,
      effect: 'Permanent combat emblem',
    },
  ];

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handlePurchase = async (itemId: string) => {
    try {
      setPurchasing(true);
      await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      await loadData();
    } finally {
      setPurchasing(false);
    }
  };

  const handleToggleEquip = (itemId: string) => {
    if (equippedIds.includes(itemId)) {
      setEquippedIds((prev) => prev.filter((id) => id !== itemId));
    } else {
      setEquippedIds((prev) => [...prev, itemId]);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] p-6">
        <div className="max-w-4xl mx-auto space-y-4 pt-12">
          <div className="h-8 bg-[var(--bg-surface-1)] rounded w-48 animate-pulse" />
          <div className="h-64 bg-[var(--bg-surface-1)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const userGrit = data.user?.grit || 120;
  const totalLevel = data.attributes?.reduce((sum: number, a: any) => sum + a.level, 0) || 1;
  const totalXp = data.attributes?.reduce((sum: number, a: any) => sum + a.xp, 0) || 0;
  const activeShadow = data.attributes?.find((a: any) => a.shadow && !a.shadow.defeatedAt);

  const getRarityBadgeStyle = (rarity: ShopItem['rarity']) => {
    switch (rarity) {
      case 'common':
        return { border: 'border-gray-500/50', text: 'text-gray-400', glow: '' };
      case 'uncommon':
        return { border: 'border-emerald-500/50', text: 'text-emerald-400', glow: '' };
      case 'rare':
        return { border: 'border-sky-500/50', text: 'text-sky-400', glow: 'shadow-[0_0_12px_rgba(91,124,153,0.3)]' };
      case 'epic':
        return { border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-[0_0_14px_rgba(199,154,92,0.35)]' };
      case 'legendary':
        return { border: 'border-red-500/80', text: 'text-red-400', glow: 'shadow-legendary' };
    }
  };

  const currentItems = catalogItems.filter((item) => {
    if (activeTab === 'themes') return item.type === 'theme';
    if (activeTab === 'badges') return item.type === 'badge';
    return item.type === 'relic';
  });

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-body)] flex flex-col pb-24 md:pb-12">
      <Navigation
        totalLevel={totalLevel}
        totalXp={totalXp}
        grit={userGrit}
        hasActiveShadow={!!activeShadow}
        activeShadowAttrId={activeShadow?.id}
      />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[var(--text-headline)]">
              Armory & Vault
            </h1>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              Equip soulbound relics, earn combat scar badges, and customize your chronicle.
            </p>
          </div>

          {/* Currency Vault Counter */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] rounded-xl shadow-rpg-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-serif font-bold text-sm text-[var(--accent-amber)]">
              {userGrit} Gold
            </span>
          </div>
        </div>

        {/* 3 Tabs: Themes, Badges, Relics (Section from Visual Direction Board) */}
        <div className="flex border-b border-[var(--border-subtle)] mb-8" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'themes'}
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-2 py-3 px-6 font-serif font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'themes'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-headline)]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Themes (UI Skins)</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'badges'}
            onClick={() => setActiveTab('badges')}
            className={`flex items-center gap-2 py-3 px-6 font-serif font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'badges'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-headline)]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Badges (Titles)</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'relics'}
            onClick={() => setActiveTab('relics')}
            className={`flex items-center gap-2 py-3 px-6 font-serif font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'relics'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)]'
                : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text-headline)]'
            }`}
          >
            <Gem className="w-4 h-4" />
            <span>Relics (Soulbound)</span>
          </button>
        </div>

        {/* Item Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {currentItems.map((item) => {
            const isEquipped = equippedIds.includes(item.id);
            const style = getRarityBadgeStyle(item.rarity);

            return (
              <div
                key={item.id}
                className={`p-6 rounded-xl bg-[var(--bg-surface-1)] border transition-all flex flex-col justify-between ${style.border} ${style.glow} ${
                  isEquipped ? 'ring-1 ring-[var(--accent-amber)]' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-center">
                        {item.type === 'theme' && <Palette className={`w-5 h-5 ${style.text}`} />}
                        {item.type === 'badge' && <Award className={`w-5 h-5 ${style.text}`} />}
                        {item.type === 'relic' && <Gem className={`w-5 h-5 ${style.text}`} />}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-base text-[var(--text-headline)]">
                          {item.name}
                        </h3>
                        <span className={`text-[11px] uppercase font-bold tracking-wider ${style.text}`}>
                          {item.rarity}
                        </span>
                      </div>
                    </div>

                    {/* Soulbound Chip */}
                    {item.isSoulbound && (
                      <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-[var(--bg-surface-2)] text-[var(--text-dim)] border border-[var(--border-subtle)]">
                        Soulbound
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-body)] flex items-center gap-2 mb-4">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                    <span className="text-[11px] font-medium">{item.effect}</span>
                  </div>
                </div>

                {/* Card Action: Equip Toggle or Buy */}
                <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-serif font-bold text-[var(--accent-amber)]">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{item.price === 0 ? 'Free' : `${item.price} Gold`}</span>
                  </div>

                  <button
                    onClick={() => handleToggleEquip(item.id)}
                    className={`px-4 py-2 rounded-lg font-serif font-bold text-xs transition-all cursor-pointer ${
                      isEquipped
                        ? 'bg-[var(--accent-forest)] text-white shadow-sm'
                        : 'bg-[var(--accent-slate)] hover:bg-slate-500 text-white shadow-rpg-sm'
                    }`}
                  >
                    {isEquipped ? 'Equipped ✓' : 'Equip'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
