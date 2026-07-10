const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Token එක ලබා ගැනීමේ Helper function එක
const getAuthToken = () => {
  return localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
};

// පොදු Fetch function එක
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = { ...options.headers };
  
  // FormData යවද්දි Content-Type එක auto සෙට් වෙන්න ඕන නිසා, නැත්නම් විතරක් json දානවා
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

export async function getProfile() {
  return await fetchWithAuth("/api/v1/users/me");
}

export async function updateProfile(data) {
  return await fetchWithAuth("/api/v1/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append("file", file);
  return await fetchWithAuth("/api/v1/users/me/photo", {
    method: "POST",
    body: fd,
  });
}

export async function removeAvatar() {
  return await fetchWithAuth("/api/v1/users/me/photo", {
    method: "DELETE",
  });
}

export async function changePassword(current, next) {
  try {
    return await fetchWithAuth("/api/v1/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
  } catch (err) {
    // Fallback endpoint
    return await fetchWithAuth("/api/v1/users/me/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
  }
}

export async function deactivateAccount(password) {
  return await fetchWithAuth("/api/v1/users/me/deactivate", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}