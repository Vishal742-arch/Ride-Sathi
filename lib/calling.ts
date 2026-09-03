/**
 * Contact Privacy & Telephony Service Abstraction
 * Ensures phone numbers are never sent directly to the client browser.
 */

export interface CallSession {
  callId: string;
  rideId: string;
  initiatorRole: 'PASSENGER' | 'DRIVER';
  proxyNumber: string;
  maskedRecipientNumber: string;
  status: 'INITIATED' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'FAILED';
  expiresAt: string;
}

export function maskPhoneNumber(phone?: string): string {
  if (!phone || phone.length < 4) return '+91 XXXXX XX123';
  const clean = phone.replace(/\D/g, '');
  const last4 = clean.slice(-4);
  return `+91 XXXXX XX${last4}`;
}

export async function initiatePrivacyCall(params: {
  rideId: string;
  callerId: string;
  callerRole: 'PASSENGER' | 'DRIVER';
  recipientPhoneMock?: string;
}): Promise<CallSession> {
  // In a production environment with Twilio / Exotel / Plivo,
  // this sends an API request to generate an IVR bridge number.
  // Here we use a secure abstraction with a privacy proxy.

  const proxyNumbers = ['+91 1800 572 8899', '+91 1800 572 8800', '+91 1800 572 8811'];
  const proxyNumber = proxyNumbers[Math.floor(Math.random() * proxyNumbers.length)];

  return {
    callId: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    rideId: params.rideId,
    initiatorRole: params.callerRole,
    proxyNumber,
    maskedRecipientNumber: maskPhoneNumber(params.recipientPhoneMock || '9876543210'),
    status: 'INITIATED',
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15-min call token validity
  };
}
