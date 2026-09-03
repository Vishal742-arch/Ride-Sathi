import DodoPayments from 'dodopayments';

export const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || 'dodo_test_mock_key',
  environment: (process.env.DODO_PAYMENTS_ENV as 'test_mode' | 'live_mode') || 'test_mode',
});

export async function createDodoCheckoutSession(params: {
  amountInINR: number;
  rideId: string;
  passengerEmail?: string;
  passengerName?: string;
  returnUrl?: string;
}) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;

  if (apiKey && apiKey !== 'dodo_test_mock_key') {
    try {
      const session = await dodoClient.payments.create({
        billing: {
          city: 'Indore',
          country: 'IN',
          state: 'MP',
          street: 'MG Road',
          zipcode: '452001',
        },
        customer: {
          email: params.passengerEmail || 'passenger@ridesathi.in',
          name: params.passengerName || 'Ride Sathi Passenger',
        },
        payment_link: true,
        product_cart: [
          {
            product_id: `ride_seat_${params.rideId}`,
            quantity: 1,
            amount: params.amountInINR * 100, // Amount in paise/cents
          },
        ],
        return_url: params.returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/find?paid=true`,
      });

      return {
        checkoutUrl: session.payment_link,
        paymentId: session.payment_id,
        isMock: false,
      };
    } catch (err) {
      console.warn('Dodo Payments API error, falling back to secure simulated checkout link:', err);
    }
  }

  // Graceful fallback for local development & preview mode
  return {
    checkoutUrl: `https://test.dodopayments.com/pay/mock_session_${Date.now()}?amount=${params.amountInINR}&ride=${params.rideId}`,
    paymentId: `dodo_pay_${Date.now()}`,
    isMock: true,
  };
}
