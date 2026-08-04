import {
  adminGet,
  adminPost,
  adminPut,
  adminDelete,
} from "./adminApiClient";

export async function getAllHiddenGems(category, district) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (district) params.append("district", district);
  const q = params.toString() ? `?${params.toString()}` : "";
  return adminGet(`/api/v1/gems${q}`);
}

export async function getPendingHiddenGems() {
  return adminGet("/api/v1/gems/pending");
}

export async function getPublicHiddenGems() {
  return getAllHiddenGems();
}

export async function getHiddenGemById(id) {
  return adminGet(`/api/v1/gems/${id}`);
}

export async function searchHiddenGems(keyword) {
  return adminGet(`/api/v1/gems/search?keyword=${encodeURIComponent(keyword)}`);
}

export async function createHiddenGem(data) {
  return adminPost("/api/v1/gems", data);
}

export async function submitHiddenGem(data) {
  return adminPost("/api/v1/gems/submit", data);
}

export async function updateHiddenGem(id, data) {
  return adminPut(`/api/v1/gems/${id}`, data);
}

export async function approveHiddenGem(id) {
  return adminPut(`/api/v1/gems/${id}/approve`);
}

export async function deleteHiddenGem(id) {
  return adminDelete(`/api/v1/gems/${id}`);
}