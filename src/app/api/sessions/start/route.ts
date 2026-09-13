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

    if (!task || task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: session, error } = await supabase
      .from('FocusSession')
      .insert({
        userId: user.id,
        taskId: taskId,
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Failed to create focus session' }, { status: 500 });
    }

    return NextResponse.json({ sessionId: session.id, startedAt: session.startedAt });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

