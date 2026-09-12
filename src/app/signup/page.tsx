'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Please provide your name or signature';
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Enter a valid email';
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error || 'Unable to register with these details' });
        return;
      }

      // Automatically sign in to establish session
      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setErrors({ general: signInError.message });
        return;
      }

      // Route directly to Character Init Onboarding (Section 3.4)
      router.push('/onboarding');
    } catch {
      setErrors({ general: 'Connection error while starting your ledger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface-1)] p-8 sm:p-10 rounded-2xl shadow-rpg-md border border-[var(--border-subtle)] text-[var(--text-body)]">
        <h1 className="font-serif font-bold text-3xl text-[var(--text-headline)] mb-2">
          Start your chronicle
        </h1>
        <p className="text-sm text-[var(--text-dim)] mb-8">
          Inscribe your name to defend your real-life attributes against entropy.
        </p>

        {errors.general && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--accent-brick)]/20 border border-[var(--accent-brick)]/40 text-red-300 text-xs font-medium">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="signup-name" className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
              Chronicler Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              placeholder="Your name or callsign"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-headline)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-amber)] transition-all"
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1.5 font-medium">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-headline)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-amber)] transition-all"
            />
            {errors.email && (
              <p className="text-xs text-red-400 mt-1.5 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              required
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-headline)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-amber)] transition-all"
            />
            {errors.password && (
              <p className="text-xs text-red-400 mt-1.5 font-medium">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[var(--accent-slate)] hover:bg-slate-500 text-white font-serif font-bold text-base transition-all shadow-rpg-sm hover:shadow-rpg-glow active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Initializing...' : 'Begin'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--text-dim)]">
          Already keeping a chronicle?{' '}
          <Link href="/login" className="font-semibold text-[var(--accent-amber)] underline hover:text-amber-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
