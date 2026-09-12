import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
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

    const session = await prisma.focusSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (session.endedAt) {
      return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
    }

    const now = new Date();
    const lastBeat = session.lastHeartbeat;
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

    const updated = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        heartbeatCount: { increment: 1 },
        lastHeartbeat: now,
      },
    });

    return NextResponse.json({ heartbeatCount: updated.heartbeatCount });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
