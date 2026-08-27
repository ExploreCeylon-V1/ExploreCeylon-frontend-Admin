import { adminGet, adminPatch, adminDelete } from "./adminApiClient";

export async function getSubscribeEmails(status = "all") {
  return adminGet(`/api/v1/admin/subscribe-emails?status=${status}`);
}

export async function markEmailAsAdded(id) {
  return adminPatch(`/api/v1/admin/subscribe-emails/${id}/mark-added`);
}

export async function markEmailAsNotAdded(id) {
  return adminPatch(`/api/v1/admin/subscribe-emails/${id}/mark-not-added`);
}

export async function deleteSubscribeEmail(id) {
  return adminDelete(`/api/v1/admin/subscribe-emails/${id}`);
}
