import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#1C2333] text-[#E7E1D3] relative overflow-hidden">
      {/* Background ambient warmth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#23324A]/50 rounded-full blur-3xl -z-10" />

      <div className="z-10 text-center max-w-2xl">
        <span className="text-4xl mb-4 inline-block">📜</span>
        <div className="text-xs uppercase font-serif tracking-widest text-[#A87C3F] mb-2">
          Tech Zephyr 4.0 · Life RPG
        </div>
        <h1 className="font-serif font-bold text-5xl md:text-7xl mb-6 text-[#E7E1D3] tracking-tight">
          The Living Ledger
        </h1>
        <p className="text-lg md:text-xl mb-10 text-[#DDD6C6] font-serif leading-relaxed">
          A personal chronicle where your life areas don't just decay in silence — neglect stains the record, spawning a living Shadow that remembers your past rhythm and taxes your future grind.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-[#A87C3F] hover:bg-[#926B34] text-white font-serif font-bold rounded-xl text-base transition-all shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            Inscribe Your Ledger
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 bg-[#23324A] hover:bg-[#2D3E5C] text-[#E7E1D3] border border-[#A87C3F]/40 font-serif font-semibold rounded-xl text-base transition-all w-full sm:w-auto"
          >
            Sign In
          </Link>
        </div>

        {/* Feature pillars */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-[#2A354C] pt-8">
          <div>
            <span className="text-[#A87C3F] font-serif font-bold text-sm block mb-1">
              Pattern Memory
            </span>
            <p className="text-xs text-[#9AA5B8] leading-relaxed">
              Shadows remember your trailing 14-day consistency. Falling from a strong habit creates a deeper stain.
            </p>
          </div>
          <div>
            <span className="text-[#A87C3F] font-serif font-bold text-sm block mb-1">
              Proof-of-Grind
            </span>
            <p className="text-xs text-[#9AA5B8] leading-relaxed">
              Server-timed focus sessions bank rewards and advance the seal to lift the stain. Checkbox spam won't save you.
            </p>
          </div>
          <div>
            <span className="text-[#A87C3F] font-serif font-bold text-sm block mb-1">
              Reclaimed Glory
            </span>
            <p className="text-xs text-[#9AA5B8] leading-relaxed">
              Banishing a Shadow reclaims stolen XP, unlocks a permanent Scar badge, and grants a 48h resolve boost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
