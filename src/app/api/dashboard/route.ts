import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';
import { getDecayStatus, levelProgress, xpForLevel } from '@/lib/game-engine';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const [userRes, attrRes, shadowRes, taskRes, snapRes, cosmRes, compRes] = await Promise.all([
      supabase.from('User').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('Attribute').select('*').eq('userId', user.id),
      supabase.from('ShadowEntity').select('*').eq('userId', user.id).is('defeatedAt', null),
      supabase.from('Task').select('*, attribute:Attribute(id, name)').eq('userId', user.id).order('createdAt', { ascending: false }),
      supabase.from('DailySnapshot').select('*').eq('userId', user.id).order('date', { ascending: false }).limit(14),
      supabase.from('UserCosmetic').select('*, item:CosmeticItem(*)').eq('userId', user.id),
      supabase.from('CompletionLog').select('*, task:Task(*, attribute:Attribute(*))').eq('userId', user.id).order('completedAt', { ascending: false }).limit(30),
    ]);

    const dbUser = userRes.data;
    if (!dbUser && !userRes.data && user.id !== 'demo-user-entropy-id') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawAttributes = attrRes.data || [];
    const rawShadows = shadowRes.data || [];
    const tasks = (taskRes.data || []).map((t: any) => ({
      ...t,
      attribute: t.attribute || { id: t.attributeId, name: 'General' },
    }));
    const snapshots = snapRes.data || [];
    const cosmetics = cosmRes.data || [];
    const completions = compRes.data || [];

    // Enrich attributes with decay status and progress
    const attributes = rawAttributes.map((attr: any) => {
      const activeShadow = rawShadows.find((s: any) => s.attributeId === attr.id) || null;
      return {
        ...attr,
        decayStatus: getDecayStatus(attr.lastActivityAt),
        progress: levelProgress(attr.xp, attr.level),
        xpForCurrentLevel: xpForLevel(attr.level),
        xpForNextLevel: xpForLevel(attr.level + 1),
        shadow: activeShadow,
      };
    });

    // Resolve equipped cosmetics
    const equippedTitleItem = cosmetics.find((c: any) => c.equipped && c.item?.type === 'title');
    const equippedBadgeItem = cosmetics.find((c: any) => c.equipped && (c.item?.type === 'badge' || c.item?.type === 'insignia'));

    const equippedTitle = equippedTitleItem?.item?.name || 'THE BUILDER';
    const equippedInsignia = equippedBadgeItem?.item?.name || 'CELESTIAL COMPASS';

    // Aggregate streak
    const maxStreak = Math.max(...attributes.map((a: any) => a.streak || 0), 7);
    const lastActivity = attributes.reduce<Date | null>((latest: Date | null, a: any) => {
      if (!latest || (a.lastActivityAt && new Date(a.lastActivityAt) > latest)) {
        return a.lastActivityAt ? new Date(a.lastActivityAt) : latest;
      }
      return latest;
    }, null);

    const resolvedUser = dbUser || {
      id: user.id,
      name: user.user_metadata?.name || 'THE SOVEREIGN ARTISAN',
      email: user.email || 'user@thearc.dev',
      grit: 184,
    };

    return NextResponse.json({
      user: {
        id: resolvedUser.id,
        name: resolvedUser.name,
        email: resolvedUser.email,
        grit: resolvedUser.grit ?? 184,
        marks: resolvedUser.grit ?? 184,
        streak: maxStreak,
        lastActivityAt: lastActivity?.toISOString() || new Date().toISOString(),
        equippedTitle,
        equippedInsignia,
      },
      attributes,
      tasks,
      snapshots,
      cosmetics: {
        owned: cosmetics,
      },
      completions,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
