const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

// Normalise a Strapi groomer record to the RAW_GROOMERS shape used by petStore.
function normaliseGroomer(raw) {
  const attrs = raw.attributes || raw;
  return {
    id: String(raw.id ?? attrs.id),
    name: attrs.name ?? '',
    initial: (attrs.name ?? '?')[0],
    suburb: attrs.suburb ?? '',
    distance: Number(attrs.distance ?? 0),
    rating: Number(attrs.rating ?? 0),
    reviewCount: Number(attrs.reviewCount ?? attrs.review_count ?? 0),
    priceFrom: Number(attrs.priceFrom ?? attrs.price_from ?? 0),
    badge: attrs.badge ?? null,
    badgeColor: attrs.badgeColor ?? attrs.badge_color ?? null,
    petTypes: attrs.petTypes ?? attrs.pet_types ?? [],
    nextAvailable: attrs.nextAvailable ?? attrs.next_available ?? '',
    services: attrs.services ?? [],
    reviews: attrs.reviews ?? [],
    tags: attrs.tags ?? [],
    // photo: full URL or unsplash ID — consumed by enrichGroomers in petStore
    photo: attrs.photo ?? attrs.image ?? null,
  };
}

/**
 * Fetch all groomer profiles from the API.
 *
 * Returns null (not an error) when EXPO_PUBLIC_API_URL is not configured so
 * callers can fall back to static RAW_GROOMERS data without crashing.
 *
 * Accepts an optional params object whose non-empty/non-undefined values are
 * appended as query string parameters:
 *   { service, suburb, max_price, min_rating, date }
 *
 * Returned shape per groomer matches RAW_GROOMERS in petStore.js:
 *   { id, name, initial, suburb, distance, rating, reviewCount, priceFrom,
 *     badge, badgeColor, petTypes, nextAvailable, services, reviews, tags, photo }
 *
 * @param {object} [params={}]
 * @returns {Promise<object[]|null>}
 */
export async function getGroomers(params = {}) {
  if (!API_URL) return null;

  const query = new URLSearchParams();
  const ALLOWED = ['service', 'suburb', 'max_price', 'min_rating', 'date'];
  for (const key of ALLOWED) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== '' && val !== 'Any' && val !== 'All') {
      query.set(key, String(val));
    }
  }

  const qs = query.toString();
  const url = qs ? `${API_URL}/api/groomers?${qs}` : `${API_URL}/api/groomers`;

  const response = await fetch(url, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`getGroomers failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  return items.map(normaliseGroomer);
}

/**
 * Fetch a single groomer profile by id.
 *
 * Returns null when EXPO_PUBLIC_API_URL is not configured so callers can fall
 * back to a local lookup without crashing.
 *
 * @param {string|number} id
 * @returns {Promise<object|null>}
 */
export async function getGroomerById(id) {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}/api/groomers/${id}`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`getGroomerById(${id}) failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const item = json.data ?? json;
  return normaliseGroomer(item);
}
