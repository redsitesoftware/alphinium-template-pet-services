const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

/**
 * Create a Stripe PaymentIntent for an existing booking.
 *
 * The server creates the PaymentIntent and returns a client_secret which
 * the client can use to confirm payment via the Stripe SDK. Full card UI
 * is outside demo scope — demo mode simulates immediate success.
 *
 * When EXPO_PUBLIC_API_URL is not configured, returns a mock response
 * so the UI flow works end-to-end without a Stripe account.
 *
 * @param {string} bookingId  - ID returned by createBooking()
 * @param {'deposit'|'full'} amountType  - payment amount type
 * @param {number} [price=0]  - service price in dollars (used for demo mock)
 * @returns {Promise<{ client_secret: string, amount: number, currency: string, payment_status: string }>}
 */
export async function createPaymentIntent(bookingId, amountType, price = 0) {
  if (!API_URL) {
    // Demo mode — simulate immediate payment success
    const amount = amountType === 'deposit' ? Math.round(price * 0.5) : price;
    return {
      client_secret: `pi_demo_${Date.now()}_secret`,
      amount,
      currency: 'aud',
      payment_status: 'succeeded',
    };
  }

  const response = await fetch(`${API_URL}/api/bookings/${bookingId}/pay`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ amount_type: amountType }),
  });

  if (!response.ok) {
    throw new Error(`createPaymentIntent failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const data = json.data ?? json;
  return {
    client_secret: data.client_secret ?? data.clientSecret ?? '',
    amount: Number(data.amount ?? 0),
    currency: data.currency ?? 'aud',
    payment_status: data.payment_status ?? data.paymentStatus ?? 'requires_payment_method',
  };
}
