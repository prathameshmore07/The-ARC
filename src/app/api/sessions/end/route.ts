import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';
import { validateFocusSession } from '@/lib/game-engine';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sessionId } = await request.json();
    const session = await prisma.focusSession.findUnique({ where: { id: sessionId } });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { validated, computedDurationSec } = validateFocusSession(session.heartbeatCount);

    const updated = await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        validated,
        computedDurationSec
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
