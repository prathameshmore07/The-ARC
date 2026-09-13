'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Plus, Shield } from 'lucide-react';

interface EmptyStateProps {
  type: 'dashboard' | 'quests' | 'armory';
  onAction?: () => void;
  actionHref?: string;
  actionText?: string;
}

export default function EmptyState({
  type,
  onAction,
  actionHref,
  actionText,
}: EmptyStateProps) {
  if (type === 'dashboard') {
    return (
      <div className="p-8 sm:p-12 rounded-lg border border-[#1A2534] bg-[#0A0E14] text-center my-6">
        <div className="w-12 h-12 rounded-full border border-[#C5A059]/40 bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center mx-auto mb-4">
          <Compass className="w-6 h-6" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-1">
          SOVEREIGN ORIGIN
        </span>
        <h3 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-2">
          Your Arc Begins Here.
        </h3>
        <p className="font-sans text-xs text-[#8B97A6] font-light max-w-md mx-auto mb-6">
          No milestones yet recorded. Your first move is waiting to break inertia and forge your trajectory.
        </p>
        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold transition-all rounded shadow-md cursor-pointer"
          >
            <span>{actionText || 'Start Your First Quest →'}</span>
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold transition-all rounded shadow-md cursor-pointer"
          >
            <span>{actionText || 'Start Your First Quest →'}</span>
          </button>
        ) : null}
      </div>
    );
  }

  if (type === 'quests') {
    return (
      <div className="p-8 sm:p-12 rounded-lg border border-[#1A2534] bg-[#0A0E14] text-center my-6">
        <div className="w-12 h-12 rounded-full border border-[#1E2938] bg-[#080C12] text-[#8B97A6] flex items-center justify-center mx-auto mb-4">
          <Plus className="w-6 h-6" />
        </div>
        <span className="font-mono text-[10px] tracking-[0.24em] text-[#8B97A6] uppercase font-semibold block mb-1">
          QUEST LOG EMPTY
        </span>
        <h3 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-2">
          No Moves Yet.
        </h3>
        <p className="font-sans text-xs text-[#8B97A6] font-light max-w-md mx-auto mb-6">
          Create something worth completing. Define a disciplined move to ground your focus today.
        </p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold transition-all rounded shadow-md cursor-pointer"
          >
            <span>{actionText || 'Create Quest →'}</span>
          </button>
        )}
      </div>
    );
  }

  // armory
  return (
    <div className="p-8 sm:p-12 rounded-lg border border-[#1A2534] bg-[#0A0E14] text-center my-6">
      <div className="w-12 h-12 rounded-full border border-[#1E2938] bg-[#080C12] text-[#8B97A6] flex items-center justify-center mx-auto mb-4">
        <Shield className="w-6 h-6" />
      </div>
      <span className="font-mono text-[10px] tracking-[0.24em] text-[#C5A059] uppercase font-semibold block mb-1">
        SANCTUARY SANCTUM
      </span>
      <h3 className="font-display font-semibold text-2xl text-[#F2EEE6] uppercase tracking-wide mb-2">
        Your Armory is Empty.
      </h3>
      <p className="font-sans text-xs text-[#8B97A6] font-light max-w-md mx-auto mb-6">
        Complete quests and establish milestones to begin earning Marks, unlocking titles, and forging insignias.
      </p>
      <Link
        href="/quests"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#C5A059] hover:bg-[#D4B57A] text-[#080C12] text-xs font-sans tracking-[0.2em] uppercase font-semibold transition-all rounded shadow-md cursor-pointer"
      >
        <span>Forge Your First Relic →</span>
      </Link>
    </div>
  );
}
