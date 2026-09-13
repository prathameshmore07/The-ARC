import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { email, password, name, customAttributes } = await request.json();
    if (!email || !password || !name || !email.trim() || !password.trim() || !name.trim()) {
      return NextResponse.json({ error: 'Missing or empty fields' }, { status: 400 });
    }

    const defaultNames = ['Intellect', 'Strength', 'Discipline', 'Creativity'];
    const attributeNames: string[] = Array.isArray(customAttributes) && customAttributes.length === 4
      ? customAttributes.map((n: string, idx: number) => (n && typeof n === 'string' && n.trim()) ? n.trim() : defaultNames[idx])
      : defaultNames;

    const supabase = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Auth error' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('User')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        grit: 0,
      })
      .select()
      .single();

    if (userError) {
      console.error('User DB creation error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const { data: attributes, error: attrError } = await supabase
      .from('Attribute')
      .insert(
        attributeNames.map(attrName => ({
          userId: authData.user.id,
          name: attrName,
          xp: 0,
          level: 1,
          streak: 0,
        }))
      )
      .select();

    if (attrError) {
      console.error('Attribute DB creation error:', attrError);
    }

    return NextResponse.json({ ...user, attributes: attributes || [] }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

