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

function normaliseReview(raw) {
  const attrs = raw.attributes || raw;
  return {
    id: String(raw.id ?? attrs.id ?? Math.random().toString(36).slice(2)),
    author: attrs.author ?? attrs.name ?? 'Anonymous',
    rating: Number(attrs.rating ?? attrs.stars ?? 0),
    text: attrs.text ?? attrs.content ?? '',
    date: attrs.date ?? attrs.created_at ?? new Date().toISOString(),
    photos: attrs.photos ?? [],
  };
}

/**
 * Fetch paginated reviews for a groomer.
 *
 * Demo mode (no API_URL): returns the static groomer.reviews array already in
 * petStore, normalised to the standard shape with mock pagination (hasMore: false).
 *
 * @param {string} groomerId
 * @param {number} page
 * @param {object|null} groomerFallback - static groomer object for demo mode
 * @param {string|null} authToken
 * @returns {Promise<{ reviews: object[], total: number, page: number, hasMore: boolean }>}
 */
export async function getGroomerReviews(groomerId, page = 1, groomerFallback = null, authToken = null) {
  if (!API_URL) {
    const staticReviews = (groomerFallback?.reviews ?? []).map((r, i) => ({
      id: `static-${groomerId}-${i}`,
      author: r.name ?? 'Guest',
      rating: r.stars ?? r.rating ?? 5,
      text: r.text ?? '',
      date: new Date().toISOString(),
      photos: [],
    }));
    return { reviews: staticReviews, total: staticReviews.length, page: 1, hasMore: false };
  }

  const response = await fetch(
    `${API_URL}/api/groomers/${groomerId}/reviews?page=${page}&per_page=10`,
    { headers: buildHeaders(authToken) }
  );

  if (!response.ok) {
    throw new Error(
      `getGroomerReviews(${groomerId}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  const total = json.total ?? json.meta?.total ?? items.length;
  const hasMore = json.hasMore ?? json.meta?.hasMore ?? page * 10 < total;

  return { reviews: items.map(normaliseReview), total, page, hasMore };
}

/**
 * Submit a new review for a groomer. Requires an auth token.
 *
 * Demo mode (no API_URL): returns a mock review with current timestamp immediately.
 *
 * @param {string} groomerId
 * @param {{ rating: number, text: string, photos: string[] }} payload
 * @param {string|null} authToken
 * @returns {Promise<object>}
 */
export async function submitReview(groomerId, payload, authToken = null) {
  if (!API_URL) {
    return {
      id: `mock-${Date.now()}`,
      author: 'You',
      rating: payload.rating,
      text: payload.text,
      date: new Date().toISOString(),
      photos: payload.photos ?? [],
    };
  }

  if (!authToken) {
    throw new Error('You must be signed in to leave a review');
  }

  const response = await fetch(`${API_URL}/api/groomers/${groomerId}/reviews`, {
    method: 'POST',
    headers: buildHeaders(authToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('You must be signed in to leave a review');
    }
    throw new Error(
      `submitReview(${groomerId}) failed: HTTP ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  return normaliseReview(json.data ?? json);
}
