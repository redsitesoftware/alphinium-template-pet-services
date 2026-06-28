const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  return headers;
}

// Normalise a raw pet record to a consistent shape.
function normalisePet(raw) {
  const attrs = raw.attributes || raw;
  return {
    id: String(raw.id ?? attrs.id ?? ''),
    name: attrs.name ?? '',
    species: attrs.species ?? attrs.petType ?? attrs.pet_type ?? '',
    breed: attrs.breed ?? attrs.petSize ?? attrs.pet_size ?? '',
    weight: attrs.weight ?? null,
    notes: attrs.notes ?? '',
    vaccination_status: attrs.vaccination_status ?? attrs.vaccinationStatus ?? null,
    vet_name: attrs.vet_name ?? attrs.vetName ?? null,
    allergies: attrs.allergies ?? null,
  };
}

/**
 * Fetch the current user's saved pets from the API.
 * Returns an empty array (not an error) when EXPO_PUBLIC_API_URL is not configured
 * so callers can skip silently without crashing.
 */
export async function getMyPets() {
  if (!API_URL) return [];

  const response = await fetch(`${API_URL}/api/pets`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`getMyPets failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const items = Array.isArray(json) ? json : (json.data ?? []);
  return items.map(normalisePet);
}

/**
 * Save a pet profile to the API for future bookings.
 * Returns null (not an error) when EXPO_PUBLIC_API_URL is not configured.
 */
export async function savePet(petData) {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}/api/pets`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(petData),
  });

  if (!response.ok) {
    throw new Error(`savePet failed: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const item = json.data ?? json;
  return normalisePet(item);
}
