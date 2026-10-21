import { NextRequest, NextResponse } from 'next/server';
import { calculateRoadRoute, calculateFare, LocationPoint } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, vehicleType = 'CAR', passengers = 1, seats = 1 } = body as {
      origin: LocationPoint;
      destination: LocationPoint;
      vehicleType?: 'BIKE' | 'CAR';
      passengers?: number;
      seats?: number;
    };

    if (!origin || !destination || typeof origin.latitude !== 'number' || typeof destination.latitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid origin and destination coordinates are required' },
        { status: 400 }
      );
    }

    const routeInfo = await calculateRoadRoute(origin, destination);
    const count = Number(passengers || seats) || 1;
    const fareInfo = calculateFare(routeInfo.distanceKm, vehicleType, count);

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
