'use client';

import { useEffect, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import CharacterSheet from '@/components/CharacterSheet';
import TaskList from '@/components/TaskList';
import GhostRivalPanel from '@/components/GhostRivalPanel';
import ShopModal from '@/components/ShopModal';
import LevelUpModal from '@/components/LevelUpModal';
import FocusTimerModal from '@/components/FocusTimerModal';
import DemoControlBar from '@/components/DemoControlBar';
import DecayAlertBanner from '@/components/DecayAlertBanner';

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
      stealRate: number;
      sealProgress: number;
      stepsNeeded: number;
      manifestedAt: string;
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
  const [activeFocusTask, setActiveFocusTask] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle task completion with level-up detection
  const handleTaskComplete = async (
    taskId: string,
    focusSessionId?: string
  ) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusSessionId }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.leveledUp) {
          setLevelUpData({
            attributeName: result.attributeName,
            newLevel: result.newLevel,
          });
        }
      }

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div className="h-16 bg-slate-900/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 bg-slate-900/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-64 bg-slate-900/50 rounded-xl animate-pulse" />
          <div className="lg:col-span-8 h-96 bg-slate-900/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center space-y-4 max-w-md">
          <div className="text-4xl">⚠️</div>
          <p className="text-red-400 font-bold">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalLevel = data.attributes.reduce((sum, a) => sum + a.level, 0);
  const decayingAttrs = data.attributes
    .filter((a) => a.decayStatus === 'decaying')
    .map((a) => ({ name: a.name, xpLost: 0 }));
  const currentTotalXp = data.attributes.reduce((sum, a) => sum + a.xp, 0);

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar
        user={data.user}
        grit={data.user.grit}
        totalLevel={totalLevel}
      />

      {decayingAttrs.length > 0 && (
        <DecayAlertBanner decayedAttributes={decayingAttrs} />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Character Sheet — Attributes Grid */}
        <CharacterSheet attributes={data.attributes} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Ghost Rival */}
          <div className="lg:col-span-4 space-y-6">
            <GhostRivalPanel
              snapshots={data.snapshots}
              currentTotalXp={currentTotalXp}
            />

            {/* Shop Button */}
            <button
              onClick={() => setIsShopOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-amber-500/20 to-violet-500/20 border border-amber-500/30 rounded-xl text-amber-300 font-medium hover:border-amber-500/50 transition-colors"
            >
              💰 Grit Shop — {data.user.grit} Grit
            </button>
          </div>

          {/* Right Column: Tasks */}
          <div className="lg:col-span-8 space-y-6">
            <TaskList
              tasks={data.tasks}
              attributes={data.attributes}
              onRefresh={fetchDashboardData}
              onStartFocus={(task) =>
                setActiveFocusTask({ id: task.id, title: task.title })
              }
              onComplete={handleTaskComplete}
            />
          </div>
        </div>
      </main>

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

      {/* Demo Mode Controls */}
      <DemoControlBar
        onSimulate={async (days: number) => {
          await fetch('/api/cron/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ days }),
          });
          fetchDashboardData();
        }}
      />
    </div>
  );
}
