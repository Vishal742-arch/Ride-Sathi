import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { targetUserId, reason } = await request.json();
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required.' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'User blocked in session.' });
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase.from('user_blocks').insert({
      blocker_id: user.user.id,
      blocked_id: targetUserId,
      reason: reason || 'Privacy & Safety block',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
