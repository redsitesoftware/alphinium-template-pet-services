const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

/**
 * scheduleData shape:
 * {
 *   groomerId: string,
 *   weeklyPattern: {
 *     monday:    string[],  // e.g. ['9:00 AM', '10:30 AM', '2:00 PM']
 *     tuesday:   string[],
 *     wednesday: string[],
 *     thursday:  string[],
 *     friday:    string[],
 *     saturday:  string[],
 *     sunday:    string[],
 *   }
 * }
 *
 * Slot strings follow the format 'H:MM AM|PM' (e.g. '9:00 AM', '10:30 AM').
 */

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

function normaliseSlots(json) {
  // Accept flat array or Strapi-wrapped { data: [...] }
  const raw = Array.isArray(json) ? json : (json.data ?? []);
  // Each item may be a plain string slot or an object with a `time` field
  return raw.map((item) => (typeof item === 'string' ? item : (item.time ?? item.slot ?? String(item))));
}

/**
 * Fetch available time slots for a groomer on a specific date.
 *
 * Calls GET ${EXPO_PUBLIC_API_URL}/api/groomers/:id/availability?date=YYYY-MM-DD
 *
 * Returns null when EXPO_PUBLIC_API_URL is not configured so the caller can
 * fall back to the static groomer.timeSlots array without crashing.
 *
 * @param {string|number} groomerId
 * @param {string} date - ISO date string in 'YYYY-MM-DD' format
 * @returns {Promise<string[]|null>} Array of time slot strings e.g. ['9:00 AM', '2:00 PM'], or null.
 */
export async function getAvailability(groomerId, date) {
  if (!API_URL) return null;

  const url = `${API_URL}/api/groomers/${groomerId}/availability?date=${encodeURIComponent(date)}`;
  const response = await fetch(url, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `getAvailability(${groomerId}, ${date}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  return normaliseSlots(json);
}

/**
 * Update a groomer's weekly availability schedule.
 *
 * Calls PUT ${EXPO_PUBLIC_API_URL}/api/groomer/schedule with Authorization header.
 *
 * Returns null (no-op) when EXPO_PUBLIC_API_URL is not configured.
 *
 * @param {{
 *   groomerId: string,
 *   weeklyPattern: {
 *     monday?: string[], tuesday?: string[], wednesday?: string[],
 *     thursday?: string[], friday?: string[], saturday?: string[], sunday?: string[]
 *   }
 * }} scheduleData
 * @returns {Promise<object|null>} Parsed response body, or null if API not configured.
 */
export async function setSchedule(scheduleData) {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}/api/groomer/schedule`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify({ data: scheduleData }),
  });

  if (!response.ok) {
    throw new Error(`setSchedule failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.data ?? json;
}
