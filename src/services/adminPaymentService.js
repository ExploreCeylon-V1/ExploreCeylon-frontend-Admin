import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

export async function getPayments(filters) {
  return adminGet(`/api/v1/admin/payments${buildQuery(filters)}`);
}

export async function getPaymentSummary() {
  return adminGet("/api/v1/admin/payments/summary");
}

export async function getPaymentDetail(type, id) {
  return adminGet(`/api/v1/admin/payments/${type}/${id}`);
}

export async function notifyOverdueUser(type, id, message) {
  return adminMutate(`/api/v1/admin/payments/${type}/${id}/notify`, "POST", message ? { message } : {});
}
