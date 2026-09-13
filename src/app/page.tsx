import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import LandingClient from '@/components/landing/LandingClient';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const user = await getAuthUser();
  if (user) {
    redirect('/dashboard');
  }

  return <LandingClient />;
}
