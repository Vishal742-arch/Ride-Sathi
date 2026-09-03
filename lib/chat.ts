import { createClient } from '@/lib/supabase/server';

export interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
  sender_role?: string;
}

export const mockTripMessages: Record<string, ChatMessage[]> = {
  'mock-ride-1': [
    {
      id: 'm1',
      ride_id: 'mock-ride-1',
      sender_id: 'driver-1',
      recipient_id: 'passenger-1',
      content: "Hello! I'm near the pickup point at Vijay Nagar Square.",
      read_at: new Date(Date.now() - 300000).toISOString(),
      created_at: new Date(Date.now() - 600000).toISOString(),
      sender_name: 'Rahul Sharma (Driver ✓)',
    },
    {
      id: 'm2',
      ride_id: 'mock-ride-1',
      sender_id: 'passenger-1',
      recipient_id: 'driver-1',
      content: "Got it! Arriving in 2 minutes.",
      read_at: new Date(Date.now() - 120000).toISOString(),
      created_at: new Date(Date.now() - 240000).toISOString(),
      sender_name: 'You (Passenger)',
    },
  ],
};

export async function getRideMessages(rideId: string) {
  const supabase = await createClient();
  if (!supabase) {
    return mockTripMessages[rideId] || [
      {
        id: `m-init-${rideId}`,
        ride_id: rideId,
        sender_id: 'driver-default',
        recipient_id: 'passenger-default',
        content: "Hi! Looking forward to travelling with you. Let me know when you're at the pickup spot.",
        read_at: null,
        created_at: new Date().toISOString(),
        sender_name: 'Rahul Sharma (Verified Driver ✓)',
      }
    ];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles!messages_sender_id_fkey(display_name, role)')
    .eq('ride_id', rideId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data;
}
