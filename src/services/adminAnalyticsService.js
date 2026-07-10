import { adminGet } from "./adminApiClient";

export async function getAnalytics() {
  return adminGet("/api/v1/admin/analytics");
}
