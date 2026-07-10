import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

export async function getReviews(filters) {
  return adminGet(`/api/v1/admin/reviews${buildQuery(filters)}`);
}

export async function deleteReview(entityType, id) {
  return adminMutate(`/api/v1/admin/reviews/${entityType}/${id}`, "DELETE");
}

export async function bulkDelete(items) {
  return adminMutate("/api/v1/admin/reviews/bulk-delete", "POST", { items });
}
