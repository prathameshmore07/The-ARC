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
      // 1. Try local demo login if demo credentials or placeholder Supabase URL
      const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
      if (loginEmail.toLowerCase().includes('demo') || isPlaceholder) {
        const demoRes = await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail }),
        });
        if (demoRes.ok) {
          router.push('/dashboard');
          return;
        }
      }

      // 2. Try Supabase Auth
      const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: loginEmail,
        password: loginPass,
      });

      if (authError) {
        // Graceful fallback to demo login for local testing
        const fallbackRes = await fetch('/api/auth/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail }),
        });
        if (fallbackRes.ok) {
          router.push('/dashboard');
          return;
        }
        setError(authError.message || 'Invalid credentials');
        return;
      }

      router.push('/dashboard');
    } catch {
      // Fallback
      const fallbackRes = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail }),
      });
      if (fallbackRes.ok) {
        router.push('/dashboard');
        return;
      }
      setError('Unable to reach authentication service');
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

  const handleInstantDemo = () => {
    setEmail('demo@entropyengine.dev');
    setPassword('password123');
    handleLogin('demo@entropyengine.dev', 'password123');
  };

  return (
    <div className="min-h-screen bg-[var(--ink-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--page-bone)] p-8 sm:p-10 rounded-2xl parchment-shadow border border-[var(--line)] text-[var(--fresh-ink)]">
        <h1 className="font-serif font-bold text-3xl text-[var(--fresh-ink)] mb-2">
          Welcome back.
        </h1>
        <p className="text-sm text-[var(--fresh-ink)]/70 mb-6">
          Inspect your chronicle and confront whatever has grown in your absence.
        </p>

        {/* Dummy Credentials Quick-Fill Card */}
        <div className="mb-6 p-3.5 rounded-xl bg-[var(--page-bone-dim)]/60 border border-[var(--line)] text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-serif font-bold text-[var(--brass)] uppercase tracking-wider text-[11px]">
              Dummy Credentials
            </span>
            <button
              type="button"
              onClick={handleInstantDemo}
              className="text-[11px] font-serif font-bold text-[var(--fresh-ink)] underline hover:text-[var(--brass)] cursor-pointer"
            >
              1-Click Demo Login
            </button>
          </div>
          <div className="text-[11px] text-[var(--fresh-ink)]/80 space-y-0.5">
            <div><span className="font-semibold">Email:</span> <code className="text-[var(--fresh-ink)] bg-white/40 px-1 py-0.5 rounded">demo@entropyengine.dev</code></div>
            <div><span className="font-semibold">Password:</span> <code className="text-[var(--fresh-ink)] bg-white/40 px-1 py-0.5 rounded">password123</code></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--stain)]/10 text-[var(--stain)] text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[var(--fresh-ink)] mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              placeholder="demo@entropyengine.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--fresh-ink)] placeholder-[var(--fresh-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ink-navy)] transition-all"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-[var(--fresh-ink)] mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--fresh-ink)] placeholder-[var(--fresh-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ink-navy)] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-base transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Continuing...' : 'Continue'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--fresh-ink)]/70">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-[var(--fresh-ink)] underline hover:text-[var(--brass)]">
            Start a ledger
          </Link>
        </p>
      </div>
    </div>
  );
}
