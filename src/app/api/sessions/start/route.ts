import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await request.json();
    const supabase = getSupabaseAdmin();

    const { data: task } = await supabase
      .from('Task')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    // If task exists in database, verify it belongs to the authenticated user
    if (task && task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure User record exists (e.g. for demo sessions or first-time auth)
    const { data: dbUser } = await supabase
      .from('User')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!dbUser) {
      await supabase.from('User').upsert(
        {
          id: user.id,
          email: user.email || 'user@thearc.app',
          name: user.user_metadata?.name || 'Chronicler',
        },
        { onConflict: 'id' }
      );
    }

    const { data: session, error } = await supabase
      .from('FocusSession')
      .insert({
        userId: user.id,
        taskId: taskId || 'focus-session',
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to create focus session:', error);
      return NextResponse.json({ error: error?.message || 'Failed to create focus session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id, startedAt: session.startedAt });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

