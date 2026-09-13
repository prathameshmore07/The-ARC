'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);

    try {
      // Authenticate via Supabase Auth only
      const { data, error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPass,
      });

      if (authError) {
        setError(authError.message || 'Invalid email or password.');
        return;
      }

      if (data?.user) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to reach Supabase authentication service');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide your email and password');
      return;
    }
    handleLogin(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-surface-1)] p-8 sm:p-10 rounded-2xl shadow-rpg-md border border-[var(--border-subtle)] text-[var(--text-body)]">
        <h1 className="font-serif font-bold text-3xl text-[var(--text-headline)] mb-2">
          Welcome back.
        </h1>
        <p className="text-sm text-[var(--text-dim)] mb-6">
          Inspect your chronicle and confront whatever has grown in your absence.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--accent-brick)]/20 border border-[var(--accent-brick)]/40 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="demo@entropyengine.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-headline)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-amber)] transition-all"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-[var(--text-dim)] mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm text-[var(--text-headline)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--accent-amber)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[var(--accent-slate)] hover:bg-slate-500 text-white font-serif font-bold text-base transition-all shadow-rpg-sm hover:shadow-rpg-glow active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Entering...' : 'Enter the Engine'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--text-dim)]">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-[var(--accent-amber)] underline hover:text-amber-200">
            Create a profile
          </Link>
        </p>
      </div>
    </div>
  );
}
