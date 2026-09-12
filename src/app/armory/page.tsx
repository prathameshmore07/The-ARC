'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Shield, Sparkles, Check, Lock } from 'lucide-react';

interface CosmeticItem {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
}

export default function ArmoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cosmetics' | 'titles' | 'effects'>('cosmetics');
  const [purchasing, setPurchasing] = useState(false);

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

  const handleEquip = async (itemId: string) => {
    await fetch('/api/shop/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    });
    await loadData();
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] p-6">
        <div className="max-w-3xl mx-auto space-y-4 pt-12">
          <div className="h-8 bg-[var(--page-bone)]/10 rounded w-48 animate-pulse" />
          <div className="h-64 bg-[var(--page-bone)]/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const userGrit = data.user?.grit || 0;
  const ownedCosmetics = data.cosmetics?.owned || [];
  const totalLevel = data.attributes?.reduce((sum: number, a: any) => sum + a.level, 0) || 1;
  const totalXp = data.attributes?.reduce((sum: number, a: any) => sum + a.xp, 0) || 0;
  const activeShadow = data.attributes?.find((a: any) => a.shadow && !a.shadow.defeatedAt);

  // Filter for Scar Badges earned in combat
  const scarBadges = ownedCosmetics.filter((c: any) => c.item?.name?.startsWith('Scar'));

  // The 1 MVP Item (Section 3.13: exactly ONE real item — unlockable ledger-cover color)
  const mvpCoverItem = {
    id: 'item_obsidian_cover',
    name: 'Obsidian Ledger Cover',
    type: 'cosmetic',
    price: 50,
    description: 'A deep ink-treated leather cover binding for your chronicle.',
  };

  const isCoverOwned = ownedCosmetics.some((c: any) => c.itemId === mvpCoverItem.id || c.item?.name === mvpCoverItem.name);
  const isCoverEquipped = ownedCosmetics.some((c: any) => (c.itemId === mvpCoverItem.id || c.item?.name === mvpCoverItem.name) && c.equipped);

  return (
    <div className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex flex-col pb-24 md:pb-12">
      <Navigation
        totalLevel={totalLevel}
        totalXp={totalXp}
        grit={userGrit}
        hasActiveShadow={!!activeShadow}
        activeShadowAttrId={activeShadow?.id}
      />

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-[var(--page-bone)]">
              The Armory
            </h1>
            <p className="text-xs text-[var(--page-bone-dim)] mt-1">
              Testaments of battle and chronicle custom bindings.
            </p>
          </div>

          <div className="px-4 py-2 bg-[var(--page-bone)] text-[var(--fresh-ink)] rounded-xl parchment-shadow font-serif font-bold text-sm border border-[var(--line)]">
            <span className="text-[var(--brass)] mr-1.5 font-bold">🪙</span>
            <span>{userGrit} Grit</span>
          </div>
        </div>

        {/* Category Tabs (Section 3.13: Cosmetics, Titles, Profile Effects) */}
        <div className="flex border-b border-[var(--page-bone-dim)]/20 mb-8" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'cosmetics'}
            onClick={() => setActiveTab('cosmetics')}
            className={`py-3 px-5 font-serif font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cosmetics'
                ? 'border-[var(--brass)] text-[var(--brass)]'
                : 'border-transparent text-[var(--page-bone-dim)] hover:text-[var(--page-bone)]'
            }`}
          >
            Cosmetics
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'titles'}
            onClick={() => setActiveTab('titles')}
            className={`py-3 px-5 font-serif font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'titles'
                ? 'border-[var(--brass)] text-[var(--brass)]'
                : 'border-transparent text-[var(--page-bone-dim)] hover:text-[var(--page-bone)]'
            }`}
          >
            Titles
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'effects'}
            onClick={() => setActiveTab('effects')}
            className={`py-3 px-5 font-serif font-semibold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'effects'
                ? 'border-[var(--brass)] text-[var(--brass)]'
                : 'border-transparent text-[var(--page-bone-dim)] hover:text-[var(--page-bone)]'
            }`}
          >
            Profile Effects
          </button>
        </div>

        {activeTab === 'cosmetics' && (
          <div className="space-y-8">
            {/* The One MVP Store Item (Section 3.13) */}
            <section aria-labelledby="store-item-heading">
              <h2 id="store-item-heading" className="font-serif font-bold text-lg text-[var(--brass)] mb-3">
                Chronicle Bindings
              </h2>

              <div className="bg-[var(--page-bone)] text-[var(--fresh-ink)] p-6 rounded-2xl parchment-shadow border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[var(--ink-navy)] text-[var(--brass)] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[var(--fresh-ink)]">
                      {mvpCoverItem.name}
                    </h3>
                    <p className="text-xs text-[var(--fresh-ink)]/70 mt-0.5 max-w-md">
                      {mvpCoverItem.description}
                    </p>
                    <span className="font-mono text-xs font-bold text-[var(--brass)] mt-1.5 block">
                      {mvpCoverItem.price} Grit
                    </span>
                  </div>
                </div>

                <div>
                  {isCoverOwned ? (
                    <button
                      onClick={() => !isCoverEquipped && handleEquip(mvpCoverItem.id)}
                      disabled={isCoverEquipped}
                      className={`px-5 py-2.5 rounded-xl font-serif font-bold text-xs transition-all ${
                        isCoverEquipped
                          ? 'bg-[var(--reclaim)] text-white cursor-default'
                          : 'bg-[var(--fresh-ink)] text-[var(--page-bone)] hover:bg-[var(--fresh-ink)]/90'
                      }`}
                    >
                      {isCoverEquipped ? 'Bound to Ledger ✓' : 'Bind Cover'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(mvpCoverItem.id)}
                      disabled={userGrit < mvpCoverItem.price || purchasing}
                      className="px-5 py-2.5 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      {userGrit < mvpCoverItem.price ? 'Need 50 Grit' : 'Purchase (50 Grit)'}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Automatically Awarded Shadow Scar Badges (Section 3.13) */}
            <section aria-labelledby="scars-heading">
              <h2 id="scars-heading" className="font-serif font-bold text-lg text-[var(--brass)] mb-3">
                Shadow Scars (Earned in Battle)
              </h2>

              {scarBadges.length === 0 ? (
                <div className="bg-[var(--page-bone)]/5 p-6 rounded-xl border border-[var(--page-bone-dim)]/15 text-xs text-[var(--page-bone-dim)] italic">
                  No Shadow Scars yet. Confront and banish an active Shadow entity to earn permanent combat testament badges.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scarBadges.map((scar: any) => (
                    <div
                      key={scar.id}
                      className="p-4 rounded-xl bg-[var(--page-bone)] text-[var(--fresh-ink)] parchment-shadow border border-[var(--line)] flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--reclaim)] text-white flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-[var(--fresh-ink)]">
                          {scar.item?.name}
                        </h4>
                        <span className="text-[11px] text-[var(--fresh-ink)]/60">
                          {scar.item?.description || 'Testament of victory over the void.'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'titles' && (
          <div className="bg-[var(--page-bone)]/5 p-8 rounded-2xl border border-[var(--page-bone-dim)]/15 text-center text-sm text-[var(--page-bone-dim)]">
            <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="font-serif text-sm">Titles unlock automatically as your primary life areas level up.</p>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="bg-[var(--page-bone)]/5 p-8 rounded-2xl border border-[var(--page-bone-dim)]/15 text-center text-sm text-[var(--page-bone-dim)]">
            <Lock className="w-6 h-6 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="font-serif text-sm">Profile auras unlock upon banishing 3 consecutive Shadows.</p>
          </div>
        )}
      </main>
    </div>
  );
}
