import { NextRequest, NextResponse } from 'next/server';
import { listDodoPayments } from '@/lib/dodo';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || '10');

    const payments = await listDodoPayments(limit);
    return NextResponse.json(payments);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to list payments' }, { status: 500 });
  }
}
