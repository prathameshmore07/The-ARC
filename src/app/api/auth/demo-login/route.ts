import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email && typeof body.email === 'string' && body.email.trim()) 
      ? body.email.trim().toLowerCase() 
      : 'demo@entropyengine.dev';
    const name = body.name || 'Demo Chronicler';
    const demoId = 'demo-user-entropy-id';

    const supabase = getSupabaseAdmin();

    // Find or create the demo user in Supabase
    let user: any = null;
    try {
      const { data: existingUser } = await supabase
        .from('User')
        .select('*, attributes:Attribute(*)')
        .eq('email', email)
        .maybeSingle();

      user = existingUser;

      if (!user) {
        const { data: newUser } = await supabase
          .from('User')
          .insert({
            id: demoId,
            email,
            name,
            grit: 120,
          })
          .select()
          .single();

        user = newUser;

        if (user) {
          const starterAttrs = [
            { userId: user.id, name: 'Intellect', xp: 240, level: 2, streak: 3 },
            { userId: user.id, name: 'Strength', xp: 120, level: 1, streak: 1 },
            { userId: user.id, name: 'Discipline', xp: 310, level: 2, streak: 4 },
            { userId: user.id, name: 'Creativity', xp: 85, level: 1, streak: 2 },
          ];

          const { data: createdAttrs } = await supabase
            .from('Attribute')
            .insert(starterAttrs)
            .select();

          const attrs = createdAttrs || [];
          const intellectAttr = attrs.find((a: any) => a.name === 'Intellect');
          const strengthAttr = attrs.find((a: any) => a.name === 'Strength');
          const disciplineAttr = attrs.find((a: any) => a.name === 'Discipline');
          const creativityAttr = attrs.find((a: any) => a.name === 'Creativity');

          const starterTasks = [];
          if (intellectAttr) {
            starterTasks.push({
              title: 'Study algorithmic complexity & dynamic programming',
              attributeId: intellectAttr.id,
              userId: user.id,
            });
          }
          if (strengthAttr) {
            starterTasks.push({
              title: '5km Morning Tempo Run & Mobility',
              attributeId: strengthAttr.id,
              userId: user.id,
            });
          }
          if (disciplineAttr) {
            starterTasks.push({
              title: 'Complete 30m server-timed focus ritual',
              attributeId: disciplineAttr.id,
              userId: user.id,
            });
          }
          if (creativityAttr) {
            starterTasks.push({
              title: 'Draft architectural diagram for new engine',
              attributeId: creativityAttr.id,
              userId: user.id,
            });
          }

          if (starterTasks.length > 0) {
            await supabase.from('Task').insert(starterTasks);
          }
        }
      }
    } catch (dbErr) {
      console.warn('Database query during demo login (falling back to in-memory session):', dbErr);
    }

    const resolvedUser = user || {
      id: demoId,
      email,
      name,
    };

    // Set secure authentication cookie
    const cookieStore = await cookies();
    cookieStore.set(
      'ee_demo_session',
      JSON.stringify({
        id: resolvedUser.id,
        email: resolvedUser.email,
        name: resolvedUser.name,
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
        id: resolvedUser.id,
        email: resolvedUser.email,
        name: resolvedUser.name,
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

