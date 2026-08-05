import {
  adminGet,
  adminPost,
  adminPut,
  adminDelete,
} from "./adminApiClient";

function ensureStatus(ev) {
  if (!ev) return ev;
  if (!ev.status) ev.status = "DRAFT";
  return ev;
}

export async function getAllEvents(filters) {
  const params = new URLSearchParams();
  if (filters?.month) params.set("month", String(filters.month));
  if (filters?.region) params.set("region", filters.region);
  if (filters?.category) params.set("category", filters.category);

  const query = params.toString() ? `?${params.toString()}` : "";
  const parsed = await adminGet(`/api/v1/events${query}`);
  return (parsed ?? []).map(ensureStatus);
}

export async function getUpcomingEvents() {
  const parsed = await adminGet("/api/v1/events/upcoming");
  return (parsed ?? []).map(ensureStatus);
}

export async function getTripSyncEvents(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  const parsed = await adminGet(`/api/v1/events/trip-sync?${params.toString()}`);
  return (parsed ?? []).map(ensureStatus);
}

export async function getEventById(id) {
  const parsed = await adminGet(`/api/v1/events/${id}`);
  return ensureStatus(parsed);
}

export async function createEvent(data) {
  const parsed = await adminPost("/api/v1/events", data);
  return ensureStatus(parsed);
}

export async function updateEvent(id, data) {
  const parsed = await adminPut(`/api/v1/events/${id}`, data);
  return ensureStatus(parsed);
}

export async function deleteEvent(id) {
  return adminDelete(`/api/v1/events/${id}`);
}