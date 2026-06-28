const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

/**
 * Pet data shape:
 * { name, species, breed, weight, notes, vaccination_status, vet_name, allergies }
 */

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

/**
 * Save (create) a pet profile on the backend.
 * No-ops and returns null when EXPO_PUBLIC_API_URL is not configured.
 *
 * @param {{ name: string, species: string, breed: string, weight: number,
 *           notes: string, vaccination_status: string, vet_name: string,
 *           allergies: string }} petData
 * @returns {Promise<object|null>} The created pet record, or null if API is not configured.
 */
export async function savePet(petData) {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}/api/pets`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ data: petData }),
  });

  if (!response.ok) {
    throw new Error(`savePet failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.data ?? json;
}

/**
 * Fetch the authenticated user's pet profiles.
 * Returns an empty array when EXPO_PUBLIC_API_URL is not configured.
 *
 * @returns {Promise<object[]>} Array of pet records.
 */
export async function getMyPets() {
  if (!API_URL) return [];

  const response = await fetch(`${API_URL}/api/pets/me`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`getMyPets failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  return items;
}
