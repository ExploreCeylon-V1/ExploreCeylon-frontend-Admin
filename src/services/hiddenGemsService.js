const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthToken() {
  return localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
}

function getAuthHeader() {
  const token = getAuthToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Get all approved gems (public endpoint)
export async function getAllHiddenGems(category, district) {
  let url = `${API_BASE}/api/v1/gems`;
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (district) params.append("district", district);
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load hidden gems: ${response.status}`);
  }

  return response.json();
}

// Get pending gems (admin only)
export async function getPendingHiddenGems() {
  const response = await fetch(`${API_BASE}/api/v1/gems/pending`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load pending gems: ${response.status}`);
  }

  return response.json();
}

// Get public hidden gems (alias)
export async function getPublicHiddenGems() {
  return getAllHiddenGems();
}

// Get single hidden gem by ID
export async function getHiddenGemById(id) {
  const response = await fetch(`${API_BASE}/api/v1/gems/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load hidden gem: ${response.status}`);
  }

  return response.json();
}

// Search hidden gems
export async function searchHiddenGems(keyword) {
  const response = await fetch(`${API_BASE}/api/v1/gems/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search gems: ${response.status}`);
  }

  return response.json();
}

// Create new hidden gem (admin)
export async function createHiddenGem(data) {
  const response = await fetch(`${API_BASE}/api/v1/gems`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to create hidden gem");
  }

  return response.json();
}

// Submit gem for approval
export async function submitHiddenGem(data) {
  const response = await fetch(`${API_BASE}/api/v1/gems/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to submit gem");
  }

  return response.json();
}

// Update hidden gem
export async function updateHiddenGem(id, data) {
  const response = await fetch(`${API_BASE}/api/v1/gems/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to update hidden gem");
  }

  return response.json();
}

// Approve gem
export async function approveHiddenGem(id) {
  const response = await fetch(`${API_BASE}/api/v1/gems/${id}/approve`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to approve gem");
  }

  return response.json();
}

// Delete hidden gem
export async function deleteHiddenGem(id) {
  const response = await fetch(`${API_BASE}/api/v1/gems/${id}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete hidden gem");
  }
}