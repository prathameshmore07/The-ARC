'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [attributes, setAttributes] = useState(['Intellect', 'Strength', 'Discipline', 'Creativity']);
  const [showCustomAttr, setShowCustomAttr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAttrChange = (index: number, val: string) => {
    const updated = [...attributes];
    updated[index] = val;
    setAttributes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          customAttributes: attributes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize ledger');

      // Auto login after registration
      const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during ledger initialization');
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
            Inscribe Your Ledger
          </h2>
          <p className="text-xs text-[#4E5E7A] mt-1 font-serif">
            Create your chronicle. Protect your life areas from the creeping ink stain.
          </p>
        </div>
        
        {error && (
          <div className="mb-5 p-3 bg-[#8B3A3A]/10 border border-[#8B3A3A]/40 text-[#8B3A3A] rounded-lg text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif font-semibold text-[#4E5E7A] mb-1">Codename / Signature</label>
            <input
              type="text"
              required
              placeholder="e.g. Chronicler James"
              className="w-full bg-[#DDD6C6] border border-[#23324A]/20 rounded-lg px-3.5 py-2 text-sm text-[#23324A] focus:outline-none focus:ring-1 focus:ring-[#A87C3F]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-[#DDD6C6] border border-[#23324A]/20 rounded-lg px-3.5 py-2 text-sm text-[#23324A] focus:outline-none focus:ring-1 focus:ring-[#A87C3F]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Life Areas Customization (v4 Part A #9) */}
          <div className="pt-2 border-t border-[#23324A]/10">
            <button
              type="button"
              onClick={() => setShowCustomAttr(!showCustomAttr)}
              className="text-xs font-serif text-[#A87C3F] hover:underline flex items-center justify-between w-full"
            >
              <span>Customize 4 Life Areas (Optional)</span>
              <span>{showCustomAttr ? '▲' : '▼'}</span>
            </button>

            {showCustomAttr && (
              <div className="grid grid-cols-2 gap-2 mt-2.5">
                {attributes.map((attr, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={attr}
                    onChange={(e) => handleAttrChange(idx, e.target.value)}
                    placeholder={`Area ${idx + 1}`}
                    className="bg-[#DDD6C6] border border-[#23324A]/20 rounded px-2.5 py-1.5 text-xs text-[#23324A] focus:outline-none focus:ring-1 focus:ring-[#A87C3F]"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#A87C3F] hover:bg-[#926B34] text-white font-serif font-bold rounded-xl transition-all shadow-md disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? 'Inscribing Ledger...' : 'Open Your Ledger'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-[#4E5E7A] font-serif">
          Already inscribed?{' '}
          <Link href="/login" className="text-[#A87C3F] font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
