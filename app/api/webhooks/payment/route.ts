import { NextRequest, NextResponse } from 'next/server';
import { POST as dodoWebhookHandler } from '@/app/api/dodo/webhook/route';

export async function POST(request: NextRequest) {
  return dodoWebhookHandler(request);
}
