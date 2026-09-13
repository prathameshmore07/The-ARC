import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase-server';
import LandingClient from '@/components/landing/LandingClient';

export const dynamic = 'force-dynamic';

export default async function LandingPage({
  searchParams,
}: {
  searchParams?: Promise<{ logout?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;

  // If the user explicitly logged out, do not redirect to dashboard
  if (params?.logout !== 'true') {
    const user = await getAuthUser();
    if (user) {
      redirect('/dashboard');
    }
  }

  return <LandingClient />;
}
