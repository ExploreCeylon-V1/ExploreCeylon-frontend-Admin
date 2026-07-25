import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

export async function getUsers(filters) {
  return adminGet(`/api/v1/admin/users${buildQuery(filters)}`);
}

export async function getUserDetail(id) {
  return adminGet(`/api/v1/admin/users/${id}`);
}

export async function activateUser(id, password) {
  return adminMutate(`/api/v1/admin/users/${id}/activate`, "PUT", { password });
}

export async function deactivateUser(id, password) {
  return adminMutate(`/api/v1/admin/users/${id}/deactivate`, "PUT", { password });
}

export async function changeUserRole(id, role, password) {
  return adminMutate(`/api/v1/admin/users/${id}/role`, "PUT", { role, password });
}

export async function resetVerification(id, type) {
  return adminMutate(`/api/v1/admin/users/${id}/reset-verification?type=${type}`, "PUT");
}

export async function bulkActivate(ids, password) {
  return adminMutate("/api/v1/admin/users/bulk-activate", "POST", { ids, password });
}

export async function bulkDeactivate(ids, password) {
  return adminMutate("/api/v1/admin/users/bulk-deactivate", "POST", { ids, password });
}
