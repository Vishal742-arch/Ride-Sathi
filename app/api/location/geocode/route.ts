import { NextRequest, NextResponse } from 'next/server';
import { reverseGeocode, searchLocations } from '@/lib/location-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    if (lat && lng) {
      const location = await reverseGeocode(parseFloat(lat), parseFloat(lng));
      return NextResponse.json({ location });
    }

    if (q) {
      const results = await searchLocations(q);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Provide q for search or lat/lng for reverse geocoding' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Geocoding failed' }, { status: 500 });
  }
}
