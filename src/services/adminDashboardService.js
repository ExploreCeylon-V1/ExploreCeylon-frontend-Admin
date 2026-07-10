import { adminGet } from "./adminApiClient";

export async function getStats() {
  return adminGet("/api/v1/admin/dashboard");
}

export async function getRecentActivity() {
  return adminGet("/api/v1/admin/dashboard/recent-activity");
}

export async function getTopLists() {
  return adminGet("/api/v1/admin/dashboard/top-lists");
}
