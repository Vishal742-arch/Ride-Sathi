import { NextRequest, NextResponse } from 'next/server';
import { initiatePrivacyCall } from '@/lib/calling';

export async function POST(request: NextRequest) {
  try {
    const { rideId, callerRole, recipientPhone } = await request.json();
    if (!rideId || !callerRole) {
      return NextResponse.json({ error: 'Missing rideId or callerRole parameter' }, { status: 400 });
    }

    const session = await initiatePrivacyCall({
      rideId,
      callerId: 'user-current',
      callerRole,
      recipientPhoneMock: recipientPhone,
    });

    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
