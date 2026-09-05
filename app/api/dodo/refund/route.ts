import { NextRequest, NextResponse } from 'next/server';
import { createDodoRefund } from '@/lib/dodo';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, amount, reason } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId parameter is required' }, { status: 400 });
    }

    const refund = await createDodoRefund({
      paymentId: String(paymentId),
      reason,
    });


    return NextResponse.json(refund);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to process refund' }, { status: 500 });
  }
}
