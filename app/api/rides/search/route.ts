import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishedRidesStore, PublishedRide } from '@/lib/rides-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from')?.trim() ?? '';
  const to = searchParams.get('to')?.trim() ?? '';

  const supabase = await createClient();
  let dbRides: PublishedRide[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('rides')
      .select('*, drivers(profiles(display_name)), vehicle_types(label)')
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      dbRides = data.map((r: any) => ({
        id: r.id,
        driver_name: r.drivers?.profiles?.display_name || 'Verified Driver',
        driver_rating: 4.9,
        vehicle: r.vehicle_types?.label || 'Car',
        origin: r.origin || 'Indore',
        destination: r.destination || 'Ujjain',
        departure_time: new Date(r.departure_time).toLocaleString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          day: 'numeric',
          month: 'short',
        }),
        available_seats: r.available_seats || 3,
        price_per_seat: 80,
        is_verified: true,
        created_at: r.created_at || new Date().toISOString(),
        postedAt: r.created_at || new Date().toISOString(),
      }));
    }
  }

  // Combine database rides and active in-memory published rides store
  const allRides = [...publishedRidesStore, ...dbRides];

  // Filter rides matching from & to search parameters
  let filteredRides = allRides;
  if (from || to) {
    filteredRides = allRides.filter(ride => {
      const matchFrom = !from || ride.origin.toLowerCase().includes(from.toLowerCase());
      const matchTo = !to || ride.destination.toLowerCase().includes(to.toLowerCase());
      return matchFrom && matchTo;
    });
  }

  // Return filtered rides (or empty array if no rides match search parameters)
  return NextResponse.json({ rides: filteredRides });
}
