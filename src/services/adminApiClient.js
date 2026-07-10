// Shared fetch helper for the Phase 2B admin modules (Users / Bookings /
// Reviews) so each new service file doesn't reimplement the same
// auth-header + error-handling boilerplate already duplicated across the
// older per-entity service files.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthHeader() {
  const token = localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function adminGet(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: getAuthHeader(),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function adminMutate(path, method, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || errBody.message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

export function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "ALL") {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}
