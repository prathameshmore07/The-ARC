'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1C2333] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#E7E1D3] p-8 rounded-2xl parchment-shadow border border-[#A87C3F]/40 text-[#23324A]">
        <div className="text-center mb-6">
          <span className="text-3xl">📜</span>
          <h2 className="text-2xl font-serif font-bold text-[#23324A] mt-2">
            Open Your Ledger
          </h2>
          <p className="text-xs text-[#4E5E7A] mt-1 font-serif">
            Enter your credentials to inspect your life areas and defend against entropy.
          </p>
        </div>
        
        {error && (
          <div className="mb-5 p-3 bg-[#8B3A3A]/10 border border-[#8B3A3A]/40 text-[#8B3A3A] rounded-lg text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif font-semibold text-[#4E5E7A] mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="scribe@domain.com"
              className="w-full bg-[#DDD6C6] border border-[#23324A]/20 rounded-lg px-3.5 py-2 text-sm text-[#23324A] focus:outline-none focus:ring-1 focus:ring-[#A87C3F]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-serif font-semibold text-[#4E5E7A] mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-[#DDD6C6] border border-[#23324A]/20 rounded-lg px-3.5 py-2 text-sm text-[#23324A] focus:outline-none focus:ring-1 focus:ring-[#A87C3F]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#A87C3F] hover:bg-[#926B34] text-white font-serif font-bold rounded-xl transition-all shadow-md disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? 'Reading Chronicle...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#4E5E7A] font-serif">
          No ledger yet?{' '}
          <Link href="/register" className="text-[#A87C3F] font-bold hover:underline">
            Inscribe a new one
          </Link>
        </p>
      </div>
    </div>
  );
}
