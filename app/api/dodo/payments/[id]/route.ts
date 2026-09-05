import { NextRequest, NextResponse } from 'next/server';
import { getDodoPayment } from '@/lib/dodo';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Payment ID parameter is required' }, { status: 400 });
    }

    const payment = await getDodoPayment(id);
    return NextResponse.json(payment);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve payment details' }, { status: 500 });
  }
}
