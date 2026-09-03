import { NextRequest, NextResponse } from 'next/server';
import { getRideMessages, mockTripMessages } from '@/lib/chat';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rideId } = await context.params;
  const messages = await getRideMessages(rideId);
  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rideId } = await context.params;
  try {
    const { content, recipientId, senderName } = await request.json();
    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty.' }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      const newMsg = {
        id: `m-${Date.now()}`,
        ride_id: rideId,
        sender_id: 'current-user',
        recipient_id: recipientId || 'other-user',
        content: content.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
        sender_name: senderName || 'You',
      };
      if (!mockTripMessages[rideId]) mockTripMessages[rideId] = [];
      mockTripMessages[rideId].push(newMsg);
      return NextResponse.json({ message: newMsg });
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        ride_id: rideId,
        sender_id: userData.user.id,
        recipient_id: recipientId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
