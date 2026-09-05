import { NextRequest, NextResponse } from 'next/server';
import { createDodoCheckoutSession } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const { amount, rideId, email, name, returnUrl } = await request.json();

    if (!amount || !rideId) {
      return NextResponse.json({ error: 'Missing required parameters: amount and rideId are required.' }, { status: 400 });
    }

    const session = await createDodoCheckoutSession({
      amountInINR: Number(amount),
      rideId: String(rideId),
      passengerEmail: email,
      passengerName: name,
      returnUrl,
    });

    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create checkout session' }, { status: 500 });
  }
}
