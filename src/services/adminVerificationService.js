import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

/**
 * Admin Verification Service (KYC Approvals & Reviews)
 */
export async function getVerifications(filters) {
  return adminGet(`/api/v1/admin/verification${buildQuery(filters)}`);
}

export async function getImageSignedUrl(verificationId, side) {
  return adminGet(`/api/v1/admin/verification/${verificationId}/image/${side}`);
}

export async function approveVerification(verificationId) {
  return adminMutate(`/api/v1/admin/verification/${verificationId}/approve`, "POST");
}

export async function rejectVerification(verificationId, reason) {
  return adminMutate(`/api/v1/admin/verification/${verificationId}/reject`, "POST", { reason });
}
