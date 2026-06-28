const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

function generateConfirmationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PAWFECT-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create a new grooming booking.
 *
 * When EXPO_PUBLIC_API_URL is not configured, returns a plausible mock
 * response so the UI works in demo mode without a backend.
 *
 * @param {{
 *   groomer_id: string,
 *   service_id: string,
 *   slot_time: string,
 *   pet_name: string,
 *   pet_breed: string,
 *   pet_size: string,
 *   notes: string,
 * }} payload
 * @returns {Promise<{ booking_id: string, confirmation_code: string }>}
 */
export async function createBooking(payload) {
  if (!API_URL) {
    // Demo mode — return mock values immediately
    return {
      booking_id: `DEMO-${Date.now()}`,
      confirmation_code: generateConfirmationCode(),
    };
  }

  const response = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`createBooking failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const data = json.data ?? json;
  return {
    booking_id: data.booking_id ?? data.bookingId ?? data.id ?? `DEMO-${Date.now()}`,
    confirmation_code: data.confirmation_code ?? data.confirmationCode ?? generateConfirmationCode(),
    ...data,
  };
}
