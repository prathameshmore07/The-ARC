import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase-server';

async function performLogout() {
  const cookieStore = await cookies();

  // 1. Invalidate Supabase session on the server
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase signOut warning:', err);
  }

  // 2. Identify all session cookies (demo session and supabase cookies)
  const allCookies = cookieStore.getAll();
  const cookiesToClear = ['ee_demo_session'];

  for (const c of allCookies) {
    if (
      c.name.startsWith('sb-') ||
      c.name.includes('auth') ||
      c.name.includes('token') ||
      c.name.includes('session')
    ) {
      cookiesToClear.push(c.name);
    }
  }

  // 3. Delete from cookieStore
  for (const name of cookiesToClear) {
    cookieStore.delete(name);
    cookieStore.set(name, '', {
      path: '/',
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return cookiesToClear;
}

export async function POST() {
  try {
    const cookiesToClear = await performLogout();

    const response = NextResponse.json({ success: true });

    // Explicitly set deletion headers on the response for all browsers
    for (const name of cookiesToClear) {
      response.cookies.delete(name);
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookiesToClear = await performLogout();

    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);

    for (const name of cookiesToClear) {
      response.cookies.delete(name);
      response.cookies.set(name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }

    return response;
  } catch (error) {
    console.error('Logout GET error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
