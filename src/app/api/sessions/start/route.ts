import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { taskId } = await request.json();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        taskId: taskId,
        startedAt: new Date()
      }
    });

    return NextResponse.json({ sessionId: session.id, startedAt: session.startedAt });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
