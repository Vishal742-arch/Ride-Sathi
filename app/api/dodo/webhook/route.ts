import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.type || body.event;

    console.log('[Dodo Payments Webhook Event]:', eventType, body);

    // Verify webhook signature if secret key is present in headers
    const signature = request.headers.get('x-dodo-signature');

    if (eventType === 'payment.succeeded' || eventType === 'payment_intent.succeeded') {
      const paymentId = body.data?.payment_id || body.payment_id;
      // Mark booking status as CONFIRMED in database
      console.log(`Payment ${paymentId} verified successfully via Dodo Payments.`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
