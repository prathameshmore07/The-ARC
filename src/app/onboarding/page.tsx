'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Dumbbell, Flame, Palette, ArrowRight } from 'lucide-react';

const DEFAULT_ATTRIBUTES = [
  { name: 'Intellect', icon: Brain, description: 'Cognition, study, problem solving' },
  { name: 'Strength', icon: Dumbbell, description: 'Physical vigor, body, conditioning' },
  { name: 'Discipline', icon: Flame, description: 'Willpower, habits, routine endurance' },
  { name: 'Creativity', icon: Palette, description: 'Craft, art, lateral thinking' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [attributes, setAttributes] = useState<Array<{ id?: string; name: string; iconIndex: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAttributes() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.attributes && data.attributes.length === 4) {
            setAttributes(
              data.attributes.map((attr: { id: string; name: string }, idx: number) => ({
                id: attr.id,
                name: attr.name,
                iconIndex: idx,
              }))
            );
          } else {
            setAttributes(
              DEFAULT_ATTRIBUTES.map((attr, idx) => ({
                name: attr.name,
                iconIndex: idx,
              }))
            );
          }
        }
      } catch {
        setAttributes(
          DEFAULT_ATTRIBUTES.map((attr, idx) => ({
            name: attr.name,
            iconIndex: idx,
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    loadAttributes();
  }, []);

  const handleNameChange = (index: number, newName: string) => {
    const updated = [...attributes];
    updated[index].name = newName;
    setAttributes(updated);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Save any renamed attributes
      for (const attr of attributes) {
        if (attr.id && attr.name.trim()) {
          await fetch(`/api/attributes/${attr.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: attr.name.trim() }),
          });
        }
      }
    } finally {
      // Single transition: fade + slight scale (intensity 3/10) into dashboard
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ink-navy)] flex items-center justify-center p-4">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brass)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[var(--ink-navy)] text-[var(--page-bone)] flex items-center justify-center p-6"
    >
      <div className="w-full max-w-xl bg-[var(--page-bone)] p-8 sm:p-12 rounded-2xl parchment-shadow border border-[var(--line)] text-[var(--fresh-ink)]">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[var(--fresh-ink)] mb-2">
          Name the four things you're building.
        </h1>
        <p className="text-sm text-[var(--fresh-ink)]/70 mb-8 leading-relaxed">
          These are the four life areas tracked in your ledger. You can rename them to match your own life.
        </p>

        <div className="space-y-4 mb-10">
          {attributes.map((attr, idx) => {
            const IconComponent = DEFAULT_ATTRIBUTES[idx]?.icon || Flame;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-2.5 bg-[var(--page-bone-dim)]/40 rounded-xl border border-[var(--line)]"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--page-bone)] flex items-center justify-center border border-[var(--line)]/50 text-[var(--fresh-ink)] flex-shrink-0">
                  <IconComponent className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <label htmlFor={`attr-${idx}`} className="sr-only">
                    Life Area {idx + 1}
                  </label>
                  <input
                    id={`attr-${idx}`}
                    type="text"
                    value={attr.name}
                    onChange={(e) => handleNameChange(idx, e.target.value)}
                    className="w-full font-serif font-bold text-lg bg-transparent text-[var(--fresh-ink)] focus:outline-none focus:ring-0 placeholder-[var(--fresh-ink)]/40"
                    placeholder="Attribute name"
                  />
                  <span className="text-[11px] text-[var(--fresh-ink)]/60 block">
                    {DEFAULT_ATTRIBUTES[idx]?.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleComplete}
          disabled={saving}
          className="w-full py-4 px-6 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-base transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{saving ? 'Binding ledger...' : 'Open the ledger'}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}
