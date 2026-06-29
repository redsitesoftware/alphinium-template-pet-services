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

function normaliseBooking(raw) {
  const attrs = raw.attributes || raw;
  const slotTime = attrs.slot_time ?? attrs.slotTime ?? attrs.time ?? '';
  const status = attrs.status ?? 'confirmed';
  const isUpcoming = slotTime ? new Date(slotTime) > new Date() : false;
  const canReschedule =
    attrs.can_reschedule ??
    (isUpcoming && new Date(slotTime) - new Date() > 24 * 60 * 60 * 1000);
  const canCancel =
    attrs.can_cancel ??
    (status !== 'completed' && status !== 'no-show' && status !== 'cancelled');

  return {
    id: String(raw.id ?? attrs.id ?? ''),
    groomer_name: attrs.groomer_name ?? attrs.groomerName ?? attrs.groomer?.name ?? 'Groomer',
    service: attrs.service ?? attrs.service_name ?? attrs.serviceName ?? 'Grooming',
    slot_time: slotTime,
    status,
    amount: Number(attrs.amount ?? attrs.price ?? 0),
    can_reschedule: Boolean(canReschedule),
    can_cancel: Boolean(canCancel),
  };
}

const _now = new Date();

const MOCK_UPCOMING = [
  {
    id: 'mock-u1',
    groomer_name: 'The Grooming Parlour',
    service: 'Full Groom',
    slot_time: new Date(_now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    amount: 85,
    can_reschedule: true,
    can_cancel: true,
  },
  {
    id: 'mock-u2',
    groomer_name: 'Mobile Paws',
    service: 'Mobile Bath & Brush',
    slot_time: new Date(_now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    amount: 90,
    can_reschedule: true,
    can_cancel: true,
  },
  {
    id: 'mock-u3',
    groomer_name: 'Zen Tails Groom House',
    service: 'Calm Care Groom',
    slot_time: new Date(_now.getTime() + 18 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    amount: 98,
    can_reschedule: false,
    can_cancel: true,
  },
];

const MOCK_PAST = [
  {
    id: 'mock-p1',
    groomer_name: 'Fluffy Friends Grooming',
    service: 'Full Groom',
    slot_time: new Date(_now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    amount: 80,
    can_reschedule: false,
    can_cancel: false,
  },
  {
    id: 'mock-p2',
    groomer_name: 'Paw Spa & Wellness',
    service: 'Aromatherapy Bath',
    slot_time: new Date(_now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    amount: 75,
    can_reschedule: false,
    can_cancel: false,
  },
];

/**
 * Fetch the current user's bookings, split into upcoming and past.
 *
 * Demo mode (no API_URL): returns 3 mock upcoming and 2 past bookings.
 *
 * @param {string|null} authToken
 * @returns {Promise<{ upcoming: object[], past: object[] }>}
 */
export async function getMyBookings(authToken = null) {
  if (!API_URL) {
    return { upcoming: MOCK_UPCOMING, past: MOCK_PAST };
  }

  const response = await fetch(`${API_URL}/api/bookings/me`, {
    headers: buildHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(`getMyBookings failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  const normalised = items.map(normaliseBooking);
  const now = new Date();

  return {
    upcoming: normalised.filter((b) => new Date(b.slot_time) > now),
    past: normalised.filter((b) => new Date(b.slot_time) <= now),
  };
}

/**
 * Reschedule a booking to a new time slot.
 *
 * Throws if the booking is within 24h of its current slot_time (demo mode bypasses this).
 *
 * Demo mode: returns the booking id with updated slot_time.
 *
 * @param {string} bookingId
 * @param {string} newSlotTime
 * @param {string|null} authToken
 * @returns {Promise<object>}
 */
export async function rescheduleBooking(bookingId, newSlotTime, authToken = null) {
  if (!API_URL) {
    return { id: bookingId, slot_time: newSlotTime };
  }

  const response = await fetch(`${API_URL}/api/bookings/${bookingId}/reschedule`, {
    method: 'PUT',
    headers: buildHeaders(authToken),
    body: JSON.stringify({ slot_time: newSlotTime }),
  });

  if (!response.ok) {
    throw new Error(
      `rescheduleBooking(${bookingId}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  return normaliseBooking(json.data ?? json);
}

/**
 * Cancel a booking.
 *
 * Demo mode: returns mock cancellation response immediately.
 *
 * @param {string} bookingId
 * @param {string|null} authToken
 * @returns {Promise<{ cancelled: boolean, booking_id: string }>}
 */
export async function cancelBooking(bookingId, authToken = null) {
  if (!API_URL) {
    return { cancelled: true, booking_id: bookingId };
  }

  const response = await fetch(`${API_URL}/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: buildHeaders(authToken),
  });

  if (!response.ok) {
    throw new Error(
      `cancelBooking(${bookingId}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  return { cancelled: true, booking_id: bookingId };
}
