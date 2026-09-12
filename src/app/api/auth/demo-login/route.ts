import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email && typeof body.email === 'string' && body.email.trim()) 
      ? body.email.trim().toLowerCase() 
      : 'demo@entropyengine.dev';
    const name = body.name || 'Demo Chronicler';

    // Find or create the demo user in Prisma
    let user = await prisma.user.findUnique({
      where: { email },
      include: { attributes: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'demo-user-entropy-id',
          email,
          name,
          grit: 120,
          attributes: {
            create: [
              { name: 'Intellect', xp: 240, level: 2, streak: 3 },
              { name: 'Strength', xp: 120, level: 1, streak: 1 },
              { name: 'Discipline', xp: 310, level: 2, streak: 4 },
              { name: 'Creativity', xp: 85, level: 1, streak: 2 },
            ],
          },
        },
        include: { attributes: true },
      });

      // Populate starter quests
      const intellectAttr = user.attributes.find((a) => a.name === 'Intellect');
      const strengthAttr = user.attributes.find((a) => a.name === 'Strength');
      const disciplineAttr = user.attributes.find((a) => a.name === 'Discipline');
      const creativityAttr = user.attributes.find((a) => a.name === 'Creativity');

      if (intellectAttr) {
        await prisma.task.create({
          data: {
            title: 'Study algorithmic complexity & dynamic programming',
            attributeId: intellectAttr.id,
            userId: user.id,
          },
        });
      }
      if (strengthAttr) {
        await prisma.task.create({
          data: {
            title: '5km Morning Tempo Run & Mobility',
            attributeId: strengthAttr.id,
            userId: user.id,
          },
        });
      }
      if (disciplineAttr) {
        await prisma.task.create({
          data: {
            title: 'Complete 30m server-timed focus ritual',
            attributeId: disciplineAttr.id,
            userId: user.id,
          },
        });
      }
      if (creativityAttr) {
        await prisma.task.create({
          data: {
            title: 'Draft architectural diagram for new engine',
            attributeId: creativityAttr.id,
            userId: user.id,
          },
        });
      }
    }

    // Set secure authentication cookie
    const cookieStore = await cookies();
    cookieStore.set(
      'ee_demo_session',
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
      }),
      {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
