const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

function buildHeaders(authToken) {
  const headers = { 'Content-Type': 'application/json' };
  const token = authToken || API_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function normaliseAppointment(raw) {
  const attrs = raw.attributes || raw;
  return {
    id: String(raw.id ?? attrs.id ?? ''),
    customer_name: attrs.customer_name ?? attrs.customerName ?? attrs.customer?.name ?? 'Customer',
    pet_name: attrs.pet_name ?? attrs.petName ?? attrs.pet?.name ?? 'Pet',
    service: attrs.service ?? attrs.service_name ?? attrs.serviceName ?? 'Grooming',
    slot_time: attrs.slot_time ?? attrs.slotTime ?? attrs.time ?? '',
    status: attrs.status ?? 'confirmed',
    notes: attrs.notes ?? '',
    amount: Number(attrs.amount ?? attrs.price ?? 0),
  };
}

function buildMockAppointments() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  return [
    {
      id: 'admin-mock-1',
      customer_name: 'Emma Thompson',
      pet_name: 'Buddy',
      service: 'Full Groom',
      slot_time: `${dateStr}T09:00:00`,
      status: 'confirmed',
      notes: 'Anxious around other dogs — please keep in separate bay.',
      amount: 85,
    },
    {
      id: 'admin-mock-2',
      customer_name: 'James Keller',
      pet_name: 'Luna',
      service: 'Bath & Brush',
      slot_time: `${dateStr}T10:30:00`,
      status: 'completed',
      notes: '',
      amount: 65,
    },
    {
      id: 'admin-mock-3',
      customer_name: 'Sarah Mitchell',
      pet_name: 'Mochi',
      service: 'Nail Trim',
      slot_time: `${dateStr}T11:30:00`,
      status: 'pending',
      notes: 'First visit.',
      amount: 20,
    },
    {
      id: 'admin-mock-4',
      customer_name: 'Pete Harrison',
      pet_name: 'Rex',
      service: 'Full Groom',
      slot_time: `${dateStr}T14:00:00`,
      status: 'confirmed',
      notes: '',
      amount: 85,
    },
    {
      id: 'admin-mock-5',
      customer_name: 'Lisa Warren',
      pet_name: 'Coco',
      service: 'De-shedding',
      slot_time: `${dateStr}T15:30:00`,
      status: 'confirmed',
      notes: 'Double coat — allow extra time.',
      amount: 75,
    },
  ];
}

/**
 * Fetch the groomer's bookings for a specific date.
 *
 * Demo mode (no API_URL): returns hardcoded mock appointments for today.
 *
 * @param {string} date - ISO date string 'YYYY-MM-DD'
 * @param {string|null} authToken
 * @returns {Promise<object[]>}
 */
export async function getGroomerBookings(date, authToken = null) {
  if (!API_URL) {
    return buildMockAppointments();
  }

  const response = await fetch(
    `${API_URL}/api/groomer/bookings?date=${encodeURIComponent(date)}`,
    { headers: buildHeaders(authToken) }
  );

  if (!response.ok) {
    throw new Error(
      `getGroomerBookings(${date}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  return items.map(normaliseAppointment);
}

/**
 * Update the status of a booking.
 *
 * Status values: 'confirmed' | 'completed' | 'no-show'
 *
 * Demo mode: returns { id, status } immediately.
 *
 * @param {string} bookingId
 * @param {'confirmed'|'completed'|'no-show'} status
 * @param {string|null} authToken
 * @returns {Promise<object>}
 */
export async function updateBookingStatus(bookingId, status, authToken = null) {
  if (!API_URL) {
    return { id: bookingId, status };
  }

  const response = await fetch(`${API_URL}/api/bookings/${bookingId}/status`, {
    method: 'PUT',
    headers: buildHeaders(authToken),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(
      `updateBookingStatus(${bookingId}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  return normaliseAppointment(json.data ?? json);
}
