import {
  adminGet,
  adminPost,
  adminPut,
  adminDelete,
} from "./adminApiClient";

export async function getAll(category, province, month) {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.append("category", category);
  if (province) params.append("province", province);
  if (month) params.append("month", month);
  params.append("includeAll", "true");
  params.append("t", Date.now().toString());

  return adminGet(`/api/v1/destinations?${params.toString()}`);
}

export async function getFeatured() {
  return adminGet("/api/v1/destinations/featured");
}

export async function search(keyword) {
  return adminGet(`/api/v1/destinations/search?keyword=${encodeURIComponent(keyword)}`);
}

export async function getById(id) {
  return adminGet(`/api/v1/destinations/${id}`);
}

export async function create(payload) {
  return adminPost("/api/v1/destinations", payload);
}

export async function update(id, payload) {
  return adminPut(`/api/v1/destinations/${id}`, payload);
}

export async function toggleFeatured(id, featured) {
  return adminPut(`/api/v1/destinations/${id}/featured?featured=${featured}`);
}

export async function toggleActive(id, active) {
  return adminPut(`/api/v1/destinations/${id}/active?active=${active}`);
}

export async function remove(id) {
  return adminDelete(`/api/v1/destinations/${id}`);
}