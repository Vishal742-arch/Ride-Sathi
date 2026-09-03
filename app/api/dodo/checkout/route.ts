import { NextRequest, NextResponse } from 'next/server';
import { createDodoCheckoutSession } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const { amount, rideId, email, name } = await request.json();

    if (!amount || !rideId) {
      return NextResponse.json({ error: 'Missing amount or rideId' }, { status: 400 });
    }

    const session = await createDodoCheckoutSession({
      amountInINR: Number(amount),
      rideId,
      passengerEmail: email,
      passengerName: name,
    });

    return NextResponse.json(session);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
