import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

export async function getBookings(filters) {
  return adminGet(`/api/v1/admin/bookings${buildQuery(filters)}`);
}

export async function getVehicleBookingDetail(id) {
  return adminGet(`/api/v1/vehicle-bookings/${id}`);
}

export async function getGuideBookingDetail(id) {
  return adminGet(`/api/v1/guide-bookings/${id}`);
}

export async function getBookingDetail(type, id) {
  return type === "VEHICLE" ? getVehicleBookingDetail(id) : getGuideBookingDetail(id);
}

export async function cancelBooking(type, id) {
  const path = type === "VEHICLE"
    ? `/api/v1/vehicle-bookings/${id}/cancel`
    : `/api/v1/guide-bookings/${id}/cancel`;
  return adminMutate(path, "PATCH");
}

export async function updateBookingStatus(type, id, status) {
  const path = type === "VEHICLE"
    ? `/api/v1/vehicle-bookings/${id}/status?status=${status}`
    : `/api/v1/guide-bookings/${id}/status?status=${status}`;
  return adminMutate(path, "PATCH");
}

export async function bulkUpdateStatus(items, status) {
  return adminMutate("/api/v1/admin/bookings/bulk-status", "POST", { items, status });
}
