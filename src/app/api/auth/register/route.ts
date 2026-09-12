import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  return createClient(url, key);
}

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

    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        attributes: {
          create: attributeNames.map(attrName => ({ name: attrName }))
        }
      },
      include: { attributes: true }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
