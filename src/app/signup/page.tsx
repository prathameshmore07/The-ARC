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
    <div className="min-h-screen bg-[var(--ink-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--page-bone)] p-8 sm:p-10 rounded-2xl parchment-shadow border border-[var(--line)] text-[var(--fresh-ink)]">
        <h1 className="font-serif font-bold text-3xl text-[var(--fresh-ink)] mb-2">
          Start your ledger
        </h1>
        <p className="text-sm text-[var(--fresh-ink)]/70 mb-8">
          Inscribe your name to defend your life areas against entropy.
        </p>

        {errors.general && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--stain)]/10 text-[var(--stain)] text-xs font-medium">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="signup-name" className="block text-xs font-semibold text-[var(--fresh-ink)] mb-1.5">
              Name
            </label>
            <input
              id="signup-name"
              type="text"
              required
              placeholder="Your name or signature"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--fresh-ink)] placeholder-[var(--fresh-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ink-navy)] transition-all"
            />
            {errors.name && (
              <p className="text-xs text-[var(--stain)] mt-1.5 font-medium">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-xs font-semibold text-[var(--fresh-ink)] mb-1.5">
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
              className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--fresh-ink)] placeholder-[var(--fresh-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ink-navy)] transition-all"
            />
            {errors.email && (
              <p className="text-xs text-[var(--stain)] mt-1.5 font-medium">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-xs font-semibold text-[var(--fresh-ink)] mb-1.5">
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
              className="w-full bg-[var(--page-bone-dim)]/50 border border-[var(--line)] rounded-xl px-4 py-3 text-sm text-[var(--fresh-ink)] placeholder-[var(--fresh-ink)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--ink-navy)] transition-all"
            />
            {errors.password && (
              <p className="text-xs text-[var(--stain)] mt-1.5 font-medium">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--ink-navy)] font-serif font-bold text-base transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Opening ledger...' : 'Begin'}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--fresh-ink)]/70">
          Already keeping a ledger?{' '}
          <Link href="/login" className="font-semibold text-[var(--fresh-ink)] underline hover:text-[var(--brass)]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
