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
 * Get the authenticated user from the session (Supabase or Demo Session).
 * Returns null if not authenticated.
 */
export async function getAuthUser() {
  const cookieStore = await cookies();

  // 1. Check for local demo session cookie first
  const demoCookie = cookieStore.get('ee_demo_session');
  if (demoCookie?.value) {
    try {
      const parsed = JSON.parse(demoCookie.value);
      if (parsed && parsed.id) {
        return {
          id: parsed.id,
          email: parsed.email || 'demo@entropyengine.dev',
          user_metadata: { name: parsed.name || 'Demo Chronicler' },
        };
      }
    } catch {
      // ignore invalid json
    }
  }

  // 2. Check Supabase session
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}
