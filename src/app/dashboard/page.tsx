'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import LivingLedger from '@/components/LivingLedger';
import ChronoDial from '@/components/ChronoDial';
import LedgerToast, { LedgerToastData } from '@/components/LedgerToast';
import ShopModal from '@/components/ShopModal';
import LevelUpModal from '@/components/LevelUpModal';
import FocusTimerModal from '@/components/FocusTimerModal';

interface DashboardData {
  user: {
    id: string;
    name: string | null;
    email: string;
    grit: number;
  };
  attributes: Array<{
    id: string;
    name: string;
    xp: number;
    level: number;
    streak: number;
    lastActivityAt: string;
    decayStatus: 'stable' | 'vulnerable' | 'decaying';
    progress: number;
    xpForCurrentLevel: number;
    xpForNextLevel: number;
    xpBoostUntil: string | null;
    shadow: {
      id: string;
      hp: number;
      baselineWeeklyRate: number;
      stealRate: number;
      sealProgress: number;
      stepsNeeded: number;
      stolenXpPool?: number;
    } | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    attributeId: string;
    attribute: { id: string; name: string };
    createdAt: string;
  }>;
  snapshots: Array<{
    id: string;
    date: string;
    totalXp: number;
  }>;
  cosmetics: {
    owned: Array<{
      id: string;
      itemId: string;
      equipped: boolean;
      item: {
        id: string;
        name: string;
        type: string;
        cssClass: string;
        description: string | null;
        price: number;
      };
    }>;
  };
}

interface LevelUpInfo {
  attributeName: string;
  newLevel: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpInfo | null>(null);
  const [ledgerToast, setLedgerToast] = useState<LedgerToastData | null>(null);
  const [activeFocusTask, setActiveFocusTask] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load living ledger');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred loading the ledger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle task completion with transparent 3-number ledger reconciliation
  const handleTaskComplete = async (taskId: string, focusSessionId?: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusSessionId }),
      });

      if (res.ok) {
        const result = await res.json();
        
        // Trigger Ledger Toast (v4 Part A #7)
        setLedgerToast({
          earned: result.earned,
          stolen: result.stolen,
          secured: result.secured,
          reclaimed: result.reclaimed,
          shadowDefeated: result.shadowDefeated,
          attributeName: result.attributeName,
        });

        // Trigger Level-Up Celebration
        if (result.leveledUp) {
          setLevelUpData({
            attributeName: result.attributeName,
            newLevel: result.newLevel,
          });
        }
      }

      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  const handleAddTask = async (title: string, attributeId: string) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, attributeId }),
    });
    await fetchDashboardData();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    await fetchDashboardData();
  };

  const handleRenameAttribute = async (attributeId: string, newName: string) => {
    await fetch(`/api/attributes/${attributeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    await fetchDashboardData();
  };

  const handleFastForward = async (days: number) => {
    await fetch('/api/cron/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days }),
    });
    await fetchDashboardData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#1C2333] p-6 space-y-6 max-w-5xl mx-auto">
        <div className="h-16 bg-[#23324A]/40 rounded-xl animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 bg-[#23324A]/30 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1C2333] flex items-center justify-center p-4">
        <div className="bg-[#E7E1D3] p-8 rounded-2xl parchment-shadow border border-[#A87C3F] text-center space-y-4 max-w-md text-[#23324A]">
          <div className="text-4xl">📜</div>
          <h3 className="font-serif font-bold text-lg">Ledger Access Issue</h3>
          <p className="text-xs text-[#4E5E7A]">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-[#A87C3F] hover:bg-[#926B34] text-white font-serif font-bold text-xs rounded-lg transition-colors shadow"
          >
            Re-read Ledger
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalLevel = data.attributes.reduce((sum, a) => sum + a.level, 0);

  return (
    <div className="min-h-screen bg-[#1C2333] text-[#E7E1D3] flex flex-col pb-20">
      <Navbar
        user={data.user}
        grit={data.user.grit}
        totalLevel={totalLevel}
      >
        {/* Diegetic Chrono Dial Fast-Forward in Header (v4 Part A #5) */}
        <ChronoDial onFastForward={handleFastForward} />
      </Navbar>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* The Living Ledger — Primary Navigation Lens (v4 Part A #3) */}
        <LivingLedger
          attributes={data.attributes}
          tasks={data.tasks}
          onCompleteTask={handleTaskComplete}
          onStartFocus={(task) => setActiveFocusTask({ id: task.id, title: task.title })}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          onRenameAttribute={handleRenameAttribute}
        />

        {/* Footer Ledger Bar: Grit Market trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-[#2A354C] bg-[#23324A]/40 gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#9AA5B8]">
            <span className="text-[#A87C3F]">✦</span>
            <span>All entries sealed with immutable timestamps and server-verified proof of grind.</span>
          </div>
          <button
            onClick={() => setIsShopOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#23324A] hover:bg-[#2D3E5C] text-[#A87C3F] font-serif font-semibold border border-[#A87C3F]/40 transition-colors shadow-sm whitespace-nowrap"
          >
            The Void Market · {data.user.grit} 🪙
          </button>
        </div>
      </main>

      {/* Transparent Three-Figure Ledger Toast (v4 Part A #7) */}
      <LedgerToast
        toast={ledgerToast}
        onDismiss={() => setLedgerToast(null)}
      />

      {/* Modals */}
      {isShopOpen && (
        <ShopModal
          userGrit={data.user.grit}
          ownedCosmetics={data.cosmetics.owned}
          onPurchase={async (itemId: string) => {
            await fetch('/api/shop/purchase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId }),
            });
            fetchDashboardData();
          }}
          onEquip={async (itemId: string) => {
            await fetch('/api/shop/equip', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ itemId }),
            });
            fetchDashboardData();
          }}
          onClose={() => setIsShopOpen(false)}
        />
      )}

      {levelUpData && (
        <LevelUpModal
          attributeName={levelUpData.attributeName}
          newLevel={levelUpData.newLevel}
          onClose={() => setLevelUpData(null)}
        />
      )}

      {activeFocusTask && (
        <FocusTimerModal
          taskId={activeFocusTask.id}
          taskTitle={activeFocusTask.title}
          onComplete={(sessionId) => {
            handleTaskComplete(activeFocusTask.id, sessionId);
            setActiveFocusTask(null);
          }}
          onClose={() => setActiveFocusTask(null)}
        />
      )}
    </div>
  );
}
