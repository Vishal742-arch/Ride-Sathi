import { NextRequest, NextResponse } from 'next/server';
import { calculateRoadRoute, calculateFare, LocationPoint } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, vehicleType = 'CAR' } = body as {
      origin: LocationPoint;
      destination: LocationPoint;
      vehicleType?: 'BIKE' | 'CAR';
    };

    if (!origin || !destination || typeof origin.latitude !== 'number' || typeof destination.latitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid origin and destination coordinates are required' },
        { status: 400 }
      );
    }

    const routeInfo = await calculateRoadRoute(origin, destination);
    const fareInfo = calculateFare(routeInfo.distanceKm, vehicleType);

    return NextResponse.json({
      success: true,
      route: routeInfo,
      fare: fareInfo,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to calculate road route and fare' },
      { status: 500 }
    );
  }
}
