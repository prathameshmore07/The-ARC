import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-grid-pattern relative overflow-hidden">
      <div className="z-10 text-center max-w-3xl">
        <h1 className="text-6xl md:text-8xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400 animate-pulse-glow">
          ENTROPY ENGINE
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-gray-300 font-medium">
          Your stats don't just grow — they decay. Fight the void.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/register" className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded text-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            Begin Your Journey
          </Link>
          <Link href="/login" className="px-8 py-4 bg-transparent border-2 border-violet-500 hover:bg-violet-900/30 text-violet-300 font-bold rounded text-lg transition-transform hover:scale-105 shadow-[0_0_15px_rgba(167,139,250,0.2)]">
            Sign In
          </Link>
        </div>
      </div>
      
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-900/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
    </div>
  );
}
