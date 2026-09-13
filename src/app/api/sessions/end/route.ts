import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';
import { validateFocusSession } from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await request.json();
    const supabase = getSupabaseAdmin();

    const { data: session } = await supabase
      .from('FocusSession')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { validated, computedDurationSec } = validateFocusSession(session.heartbeatCount);

    const { data: updated, error } = await supabase
      .from('FocusSession')
      .update({
        endedAt: new Date().toISOString(),
        validated,
        computedDurationSec,
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

