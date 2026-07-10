import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

export async function getUsers(filters) {
  return adminGet(`/api/v1/admin/users${buildQuery(filters)}`);
}

export async function getUserDetail(id) {
  return adminGet(`/api/v1/admin/users/${id}`);
}

export async function activateUser(id) {
  return adminMutate(`/api/v1/admin/users/${id}/activate`, "PUT");
}

export async function deactivateUser(id) {
  return adminMutate(`/api/v1/admin/users/${id}/deactivate`, "PUT");
}

export async function changeUserRole(id, role) {
  return adminMutate(`/api/v1/admin/users/${id}/role`, "PUT", { role });
}

export async function resetVerification(id, type) {
  return adminMutate(`/api/v1/admin/users/${id}/reset-verification?type=${type}`, "PUT");
}

export async function bulkActivate(ids) {
  return adminMutate("/api/v1/admin/users/bulk-activate", "POST", { ids });
}

export async function bulkDeactivate(ids) {
  return adminMutate("/api/v1/admin/users/bulk-deactivate", "POST", { ids });
}
