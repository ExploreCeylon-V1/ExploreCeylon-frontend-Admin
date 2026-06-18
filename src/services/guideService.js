const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthHeader() {
  const token = localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── GUIDE CORE SERVICES ──────────────────────────────────────────

export async function getAllGuides() {
  const response = await fetch(`${API_BASE}/api/v1/guides`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guides: ${response.status}`);
  }
  return await response.json();
}

export async function getGuideById(id) {
  const response = await fetch(`${API_BASE}/api/v1/guides/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guide: ${response.status}`);
  }
  return await response.json();
}

export async function getGuideBookings(guideId) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/guides/${guideId}/bookings`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 403) return [];
      throw new Error(`Failed to fetch bookings: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching guide bookings:", error);
    return [];
  }
}

export async function createGuide(data) {
  const response = await fetch(`${API_BASE}/api/v1/guides`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to create guide: ${response.status}`);
  }
  return await response.json();
}

export async function updateGuide(id, data) {
  const response = await fetch(`${API_BASE}/api/v1/guides/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to update guide: ${response.status}`);
  }
  return await response.json();
}

export async function toggleGuideAvailability(id, available) {
  const response = await fetch(`${API_BASE}/api/v1/guides/${id}/availability?available=${available}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Failed to toggle availability: ${response.status}`);
  }
  return await response.json();
}

export async function deleteGuide(id) {
  const response = await fetch(`${API_BASE}/api/v1/guides/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Delete error response:", errorText);
    throw new Error(`Failed to delete guide: ${response.status}`);
  }
}

// ─── GUIDE PAYMENT & ALL BOOKINGS SERVICES ─────────────────────────

export async function getAllGuideBookings() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/guides/bookings`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function getCompletedBookingsWithPaymentStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/admin/guides/payments/summaries`, {
      headers: { "Content-Type": "application/json", ...getAuthHeader() }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function markGuideAsPaid(guideId, payload) {
  const response = await fetch(`${API_BASE}/api/v1/admin/guides/${guideId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to mark guide as paid");
  }
  return await response.json();
}