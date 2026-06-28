const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

/**
 * Service data shape:
 * { name, duration, pricing: { small, medium, large } }
 */

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

function normaliseService(raw) {
  const attrs = raw.attributes || raw;
  return {
    id: String(raw.id ?? attrs.id ?? ''),
    name: attrs.name ?? '',
    duration: attrs.duration ?? '',
    pricing: {
      small: attrs.pricing?.small ?? attrs.price_small ?? null,
      medium: attrs.pricing?.medium ?? attrs.price_medium ?? null,
      large: attrs.pricing?.large ?? attrs.price_large ?? null,
    },
  };
}

/**
 * Fetch all services from the catalog.
 * Returns null when EXPO_PUBLIC_API_URL is not configured so callers can
 * fall back to static data without crashing.
 *
 * @returns {Promise<object[]|null>}
 */
export async function getServices() {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}/api/services`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`getServices failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  return items.map(normaliseService);
}

/**
 * Fetch the services offered by a specific groomer.
 * Returns an empty array when EXPO_PUBLIC_API_URL is not configured.
 *
 * @param {string|number} groomerId
 * @returns {Promise<object[]>}
 */
export async function getGroomerServices(groomerId) {
  if (!API_URL) return [];

  const response = await fetch(`${API_URL}/api/groomers/${groomerId}/services`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `getGroomerServices(${groomerId}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  return items.map(normaliseService);
}
