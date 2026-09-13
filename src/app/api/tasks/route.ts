import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: tasks, error } = await supabase
      .from('Task')
      .select('*, attribute:Attribute(name)')
      .eq('userId', user.id)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, attributeId } = await request.json();
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!attributeId) {
      return NextResponse.json({ error: 'Attribute ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: attribute } = await supabase
      .from('Attribute')
      .select('*')
      .eq('id', attributeId)
      .maybeSingle();

    if (!attribute || attribute.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: task, error: createError } = await supabase
      .from('Task')
      .insert({
        title: title.trim(),
        attributeId,
        userId: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

