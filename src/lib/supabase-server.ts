import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore — this can be called from a Server Component
            // where cookies can't be set. The middleware will handle refresh.
          }
        },
      },
    }
  );
}

/**
 * Get the authenticated user from Supabase Auth.
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      const cookieStore = await cookies();
      const demoCookie = cookieStore.get('ee_demo_session');
      if (demoCookie?.value) {
        try {
          const parsed = JSON.parse(demoCookie.value);
          return {
            id: parsed.id,
            email: parsed.email,
            user_metadata: { name: parsed.name },
          } as any;
        } catch {
          // ignore parsing error
        }
      }
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error fetching Supabase auth user:', error);
    return null;
  }
}
