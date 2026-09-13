import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';
import { HEARTBEAT_INTERVAL_SEC, HEARTBEAT_TOLERANCE_SEC } from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: session } = await supabase
      .from('FocusSession')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.endedAt) {
      return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
    }

    const now = new Date();
    const lastBeat = new Date(session.lastHeartbeat);
    const diffSec = (now.getTime() - lastBeat.getTime()) / 1000;

    const minInterval = HEARTBEAT_INTERVAL_SEC - HEARTBEAT_TOLERANCE_SEC;
    const maxInterval = HEARTBEAT_INTERVAL_SEC + HEARTBEAT_TOLERANCE_SEC;

    // For the first heartbeat, be lenient (user just started)
    // For subsequent beats, enforce timing window
    const isFirstBeat = session.heartbeatCount === 0;
    const isValidTiming = isFirstBeat
      ? diffSec >= minInterval // Just check minimum for first
      : diffSec >= minInterval && diffSec <= maxInterval;

    if (!isValidTiming) {
      // Still accept but log it — don't block the session over timing jitter
      // Only reject truly suspicious beats (way too fast)
      if (diffSec < minInterval * 0.5) {
        return NextResponse.json(
          { error: 'Heartbeat too soon', diffSec },
          { status: 429 }
        );
      }
    }

    const newCount = (session.heartbeatCount || 0) + 1;
    const { data: updated } = await supabase
      .from('FocusSession')
      .update({
        heartbeatCount: newCount,
        lastHeartbeat: now.toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    return NextResponse.json({ heartbeatCount: updated?.heartbeatCount || newCount });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
