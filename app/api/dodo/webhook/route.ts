import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Dodo Payments Webhook Handler
 * Verifies incoming webhook signatures and processes payment events.
 * See: https://docs.dodopayments.com/api-reference/webhooks
 */

async function verifyDodoSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const msgData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Signature may be hex-encoded
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    return await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, msgData);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get('webhook-signature') || request.headers.get('x-dodo-signature') || '';
  const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  // Signature verification when webhook secret is configured
  if (webhookSecret && signature) {
    const isValid = await verifyDodoSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('[Dodo Webhook] Invalid webhook signature – request rejected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType: string = body.type || body.event || '';
  const timestamp = new Date().toISOString();
  console.log(`[Dodo Webhook ${timestamp}] Event received: ${eventType}`);

  try {
    // Get Supabase service-role client for trusted server-side DB writes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const db = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

    switch (eventType) {
      // ── Payment succeeded ──────────────────────────────────────────────────
      case 'payment.succeeded':
      case 'payment_intent.succeeded': {
        const paymentId: string = body.data?.payment_id || body.payment_id || '';
        const rideId: string = body.data?.metadata?.ride_id || body.metadata?.ride_id || '';
        const passengerId: string = body.data?.metadata?.passenger_id || body.metadata?.passenger_id || '';
        const amount: number = body.data?.total_amount || body.data?.amount || 0;

        console.log(`[Dodo Webhook] Payment SUCCEEDED – id=${paymentId}, ride=${rideId}, amount=₹${amount / 100}`);

        if (db && rideId) {
          // Mark booking as PAID in Supabase
          const { error } = await db
            .from('bookings')
            .update({ status: 'PAID', payment_id: paymentId })
            .eq('ride_id', rideId)
            .eq(passengerId ? 'passenger_id' : 'ride_id', passengerId || rideId);

          if (error) {
            console.error('[Dodo Webhook] Supabase update error:', error.message);
          } else {
            console.log(`[Dodo Webhook] Booking for ride ${rideId} marked as PAID.`);
          }

          // Log payment record
          await db.from('payments').upsert(
            {
              payment_id: paymentId,
              ride_id: rideId,
              passenger_id: passengerId || null,
              amount,
              currency: body.data?.currency || 'INR',
              status: 'succeeded',
              provider: 'dodo',
            },
            { onConflict: 'payment_id' }
          );
        }
        break;
      }

      // ── Payment failed ─────────────────────────────────────────────────────
      case 'payment.failed':
      case 'payment_intent.failed': {
        const paymentId: string = body.data?.payment_id || body.payment_id || '';
        const rideId: string = body.data?.metadata?.ride_id || body.metadata?.ride_id || '';
        console.warn(`[Dodo Webhook] Payment FAILED – id=${paymentId}, ride=${rideId}`);

        if (db && rideId) {
          await db
            .from('bookings')
            .update({ status: 'PAYMENT_FAILED' })
            .eq('ride_id', rideId);
        }
        break;
      }

      // ── Refund succeeded ───────────────────────────────────────────────────
      case 'refund.succeeded': {
        const refundId: string = body.data?.refund_id || '';
        const paymentId: string = body.data?.payment_id || '';
        console.log(`[Dodo Webhook] Refund SUCCEEDED – refund=${refundId}, payment=${paymentId}`);

        if (db && paymentId) {
          await db
            .from('payments')
            .update({ status: 'refunded' })
            .eq('payment_id', paymentId);
        }
        break;
      }

      // ── Dispute opened ─────────────────────────────────────────────────────
      case 'dispute.opened': {
        const disputeId: string = body.data?.dispute_id || '';
        const paymentId: string = body.data?.payment_id || '';
        console.warn(`[Dodo Webhook] Dispute OPENED – dispute=${disputeId}, payment=${paymentId}`);
        break;
      }

      default:
        console.log(`[Dodo Webhook] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (err: any) {
    console.error('[Dodo Webhook] Handler error:', err?.message || err);
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
  }
}
