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
 * Create a new grooming booking.
 *
 * When EXPO_PUBLIC_API_URL is not configured, returns a mock response
 * so the UI flow works end-to-end in demo mode.
 *
 * @param {{ groomer_id: string, service_id: string, slot_time: string, pet_name: string, pet_breed: string, pet_size: string, notes: string }} params
 * @returns {Promise<{ booking_id: string, confirmation_code: string }>}
 */
export async function createBooking(params) {
  if (!API_URL) {
    // Demo mode — simulate successful booking creation
    return {
      booking_id: `bk_demo_${Date.now()}`,
      confirmation_code: `DEMO${Math.floor(10000 + Math.random() * 90000)}`,
    };
  }

  const response = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`createBooking failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const data = json.data ?? json;
  return {
    booking_id: data.booking_id ?? data.bookingId ?? data.id ?? '',
    confirmation_code: data.confirmation_code ?? data.confirmationCode ?? '',
  };
}
