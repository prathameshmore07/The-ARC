"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CosmeticItem {
  id: string;
  name: string;
  type: string;
  price: number;
  cssClass: string;
  description: string | null;
}

interface UserCosmetic {
  id: string;
  itemId: string;
  equipped: boolean;
  item?: CosmeticItem;
}

export default function ShopModal({
  userGrit = 0,
  ownedCosmetics = [],
  onPurchase,
  onEquip,
  onClose,
}: {
  userGrit: number;
  ownedCosmetics: UserCosmetic[];
  onPurchase: (id: string) => void;
  onEquip: (id: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'theme' | 'badge' | 'title'>('theme');
  const [catalog, setCatalog] = useState<CosmeticItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadShop() {
      try {
        setLoading(true);
        const res = await fetch('/api/shop');
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            setCatalog(data.items);
          } else {
            // Fallback seed items
            setCatalog([
              { id: 'theme-matrix', name: 'Cyberpunk Matrix', type: 'theme', price: 100, cssClass: 'cyberpunk-matrix', description: 'Acid neon green terminal visual theme.' },
              { id: 'theme-crimson', name: 'Crimson Glitch', type: 'theme', price: 150, cssClass: 'crimson-glitch', description: 'Blood red high-contrast decay alert theme.' },
              { id: 'theme-gold', name: 'Solar Gold', type: 'theme', price: 200, cssClass: 'solar-gold', description: 'Astral purple and warm gold celestial theme.' },
              { id: 'badge-defier', name: 'Entropy Defier', type: 'badge', price: 50, cssClass: 'badge-defier', description: 'Survived your first 48 hours with 0 decayed stats.' },
              { id: 'badge-void', name: 'Void Walker', type: 'badge', price: 75, cssClass: 'badge-void', description: 'Banished a haunting Shadow Entity in combat.' },
              { id: 'title-chrono', name: 'Chrono Master', type: 'title', price: 120, cssClass: 'title-chrono', description: 'Master of the Proof-of-Grind focus timer.' },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load shop catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, []);

  const items = catalog.filter((i) => i.type === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md sm:p-4">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        className="w-full sm:max-w-2xl bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-2xl font-bold text-white">The Void Market</h2>
              <p className="text-xs text-slate-400">Trade earned Grit for visual themes, auras, and titles</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-amber-400 text-sm font-bold bg-amber-400/10 px-3 py-1 rounded-full border border-amber-500/20">
              💰 {userGrit} Grit
            </span>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
              aria-label="Close Shop"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-800 px-6 bg-slate-900">
          <button 
            className={`py-3.5 px-4 font-medium text-sm transition-colors ${activeTab === 'theme' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('theme')}
          >
            🎨 UI Themes
          </button>
          <button 
            className={`py-3.5 px-4 font-medium text-sm transition-colors ${activeTab === 'badge' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('badge')}
          >
            🎖️ Badges
          </button>
          <button 
            className={`py-3.5 px-4 font-medium text-sm transition-colors ${activeTab === 'title' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('title')}
          >
            ⚔️ Titles
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading catalog...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => {
                const owned = ownedCosmetics.find((c) => c.itemId === item.id || (c.item && c.item.name === item.name));
                const isEquipped = owned?.equipped;
                const canAfford = userGrit >= item.price;

                return (
                  <motion.div 
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-bold text-white">{item.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">{item.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                      <span className="text-amber-400 font-bold text-sm">
                        {item.price === 0 ? 'Free' : `💰 ${item.price} Grit`}
                      </span>
                      {owned ? (
                        <button 
                          onClick={() => !isEquipped && onEquip(item.id)}
                          disabled={isEquipped}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isEquipped 
                              ? 'bg-cyan-500/20 text-cyan-400 cursor-default border border-cyan-500/30' 
                              : 'bg-slate-700 hover:bg-slate-600 text-white'
                          }`}
                        >
                          {isEquipped ? 'Equipped ✓' : 'Equip'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => onPurchase(item.id)}
                          disabled={!canAfford}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            canAfford 
                              ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          {canAfford ? 'Unlock' : 'Need More Grit'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
