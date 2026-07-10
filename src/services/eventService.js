const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Auth Helper
function authHeaders() {
  const token = localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Error Handler
async function handleResponse(res) {
  if (!res.ok) {
    const message = await res.text().catch(() => "Unknown error");
    throw new Error(`[${res.status}] ${message}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function ensureStatus(ev) {
  if (!ev) return ev;
  if (!ev.status) ev.status = "DRAFT";
  return ev;
}

// ─── Service Functions ───

export async function getAllEvents(filters) {
  const params = new URLSearchParams();
  if (filters?.month) params.set("month", String(filters.month));
  if (filters?.region) params.set("region", filters.region);
  if (filters?.category) params.set("category", filters.category);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/api/v1/events${query}`, {
    headers: authHeaders(),
  });
  const parsed = await handleResponse(res);
  return (parsed ?? []).map(ensureStatus);
}

export async function getUpcomingEvents() {
  const res = await fetch(`${BASE_URL}/api/v1/events/upcoming`, {
    headers: authHeaders(),
  });
  const parsed = await handleResponse(res);
  return (parsed ?? []).map(ensureStatus);
}

export async function getTripSyncEvents(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  const res = await fetch(`${BASE_URL}/api/v1/events/trip-sync?${params.toString()}`, {
    headers: authHeaders(),
  });
  const parsed = await handleResponse(res);
  return (parsed ?? []).map(ensureStatus);
}

export async function getEventById(id) {
  const res = await fetch(`${BASE_URL}/api/v1/events/${id}`, {
    headers: authHeaders(),
  });
  const parsed = await handleResponse(res);
  return ensureStatus(parsed);
}

// data can include: title, description, category, region, location,
// startDate, endDate, status, featured, imageUrl
export async function createEvent(data) {
  const res = await fetch(`${BASE_URL}/api/v1/events`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const parsed = await handleResponse(res);
  return ensureStatus(parsed);
}

export async function updateEvent(id, data) {
  const res = await fetch(`${BASE_URL}/api/v1/events/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const parsed = await handleResponse(res);
  return ensureStatus(parsed);
}

export async function deleteEvent(id) {
  const res = await fetch(`${BASE_URL}/api/v1/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const message = await res.text().catch(() => "Unknown error");
    throw new Error(`[${res.status}] ${message}`);
  }
}