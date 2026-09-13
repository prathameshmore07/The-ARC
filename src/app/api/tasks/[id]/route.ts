import { NextResponse } from 'next/server';
import { getAuthUser, getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: task, error } = await supabase
      .from('Task')
      .select('*, attribute:Attribute(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Fetch task error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: task } = await supabase
      .from('Task')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, string> = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    const { data: updated, error: updateError } = await supabase
      .from('Task')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data: task } = await supabase
      .from('Task')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!task) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (task.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await supabase.from('Task').delete().eq('id', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

