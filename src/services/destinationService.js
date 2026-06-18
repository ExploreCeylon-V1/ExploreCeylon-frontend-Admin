const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthToken() {
  // Token එක ලබා ගැනීම
  return localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
}

function getAuthHeader() {
  const token = getAuthToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getAll(category, province, month) {
  const params = new URLSearchParams();
  if (category && category !== "ALL") params.append("category", category);
  if (province) params.append("province", province);
  if (month) params.append("month", month);

  // Admin පැනල් එකේදී Active සහ Inactive සියල්ලම ලබාගැනීමට මෙය අත්‍යවශ්‍යයි
  params.append("includeAll", "true");
  
  // බ්‍රවුසර් එකේ Cache වීම වැලැක්වීම සඳහා
  params.append("t", Date.now().toString());

  const url = `${API_BASE}/api/v1/destinations?${params.toString()}`;

  const response = await fetch(url, {
    headers: getAuthHeader(),
    cache: "no-store", // Cache කිරීම නවත්වයි
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch destinations: ${response.status}`);
  }

  return await response.json();
}

export async function getFeatured() {
  const response = await fetch(`${API_BASE}/api/v1/destinations/featured`, {
    headers: getAuthHeader(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch featured destinations: ${response.status}`);
  }

  return await response.json();
}

export async function search(keyword) {
  const response = await fetch(`${API_BASE}/api/v1/destinations/search?keyword=${encodeURIComponent(keyword)}`, {
    headers: getAuthHeader(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to search destinations: ${response.status}`);
  }

  return await response.json();
}

export async function getById(id) {
  const response = await fetch(`${API_BASE}/api/v1/destinations/${id}`, {
    headers: getAuthHeader(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch destination: ${response.status}`);
  }

  return await response.json();
}

export async function create(payload) {
  const response = await fetch(`${API_BASE}/api/v1/destinations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create destination: ${response.status}`);
  }

  return await response.json();
}

export async function update(id, payload) {
  const response = await fetch(`${API_BASE}/api/v1/destinations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update destination: ${response.status}`);
  }

  return await response.json();
}

export async function toggleFeatured(id, featured) {
  const response = await fetch(`${API_BASE}/api/v1/destinations/${id}/featured?featured=${featured}`, {
    method: "PUT",
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle featured: ${response.status}`);
  }

  return await response.json();
}

// Active/Inactive status එක වෙනස් කිරීම
export async function toggleActive(id, active) {
  const response = await fetch(`${API_BASE}/api/v1/destinations/${id}/active?active=${active}`, {
    method: "PUT",
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle active status: ${response.status}`);
  }

  return await response.json().catch(() => ({}));
}

export async function remove(id) {
  const response = await fetch(`${API_BASE}/api/v1/destinations/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete destination: ${response.status}`);
  }
}