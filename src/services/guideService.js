import {
  adminGet,
  adminPost,
  adminPut,
  adminDelete,
} from "./adminApiClient";

// ─── GUIDE CORE SERVICES ──────────────────────────────────────────

export async function getAllGuides() {
  return adminGet("/api/v1/guides");
}

export async function getGuideById(id) {
  return adminGet(`/api/v1/guides/${id}`);
}

export async function getGuideBookings(guideId) {
  try {
    return await adminGet(`/api/v1/guides/${guideId}/bookings`);
  } catch (error) {
    console.error("Error fetching guide bookings:", error);
    return [];
  }
}

export async function createGuide(data) {
  return adminPost("/api/v1/guides", data);
}

export async function updateGuide(id, data) {
  return adminPut(`/api/v1/guides/${id}`, data);
}

export async function toggleGuideAvailability(id, available) {
  return adminPut(`/api/v1/guides/${id}/availability?available=${available}`);
}

export async function deleteGuide(id) {
  return adminDelete(`/api/v1/guides/${id}`);
}

// ─── GUIDE PAYMENT & ALL BOOKINGS SERVICES ─────────────────────────

export async function getAllGuideBookings() {
  try {
    return await adminGet("/api/v1/admin/guides/bookings");
  } catch {
    return [];
  }
}

export async function getCompletedBookingsWithPaymentStatus() {
  try {
    return await adminGet("/api/v1/admin/guides/payments/summaries");
  } catch {
    return [];
  }
}

export async function markGuideAsPaid(guideId, payload) {
  return adminPost(`/api/v1/admin/guides/${guideId}/payments`, payload);
}

export async function getGuideStats() {
  try {
    return await adminGet("/api/v1/admin/stats/guides");
  } catch (err) {
    console.error("Failed to load guide stats:", err);
    return {
      totalGuides: 0,
      availableGuides: 0,
      bookedToday: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };
  }
}