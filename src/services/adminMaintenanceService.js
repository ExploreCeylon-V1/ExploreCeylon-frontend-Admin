import { adminGet, adminMutate } from "./adminApiClient";

// GET /api/v1/maintenance/status is a public endpoint (no auth required —
// the traveler frontend checks it before login), but calling it through
// adminGet is harmless: the extra Authorization header is simply ignored.
export async function getMaintenanceStatus() {
  return adminGet("/api/v1/maintenance/status");
}

export async function updateMaintenanceStatus({ active, title, description }) {
  return adminMutate("/api/v1/admin/maintenance", "PUT", { active, title, description });
}
