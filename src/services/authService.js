const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function saveAuthData(data) {
  if (typeof window === "undefined") return;

  // Legacy keys saha backend eke standard keys save kireema
  localStorage.setItem("exploreCeylonToken", data?.accessToken ?? "");
  localStorage.setItem("token", data?.accessToken ?? "");

  if (data.role) {
    localStorage.setItem("exploreCeylonRole", data.role);
  }

  const userData = {
    id: data.userId,
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatarUrl,
  };

  localStorage.setItem("exploreCeylonUser", JSON.stringify(userData));
  localStorage.setItem("user", JSON.stringify(userData));
}

export async function login(credentials) {
  const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Login failed");
  }

  saveAuthData(data);
  return data;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("exploreCeylonToken");
    localStorage.removeItem("exploreCeylonUser");
    localStorage.removeItem("exploreCeylonRole");
    // Admin specific context keys
    localStorage.removeItem("ec_admin_token");
    localStorage.removeItem("ec_admin_user");
  }
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
  }
  return null;
}

export function getUser() {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("ec_admin_user") || localStorage.getItem("exploreCeylonUser");
    return user ? JSON.parse(user) : null;
  }
  return null;
}

export function getRole() {
  if (typeof window !== "undefined") {
    const user = getUser();
    return user?.role || localStorage.getItem("exploreCeylonRole");
  }
  return null;
}

export function isAdmin() {
  return getRole() === "ADMIN";
}

export function getAuthHeader() {
  const token = getToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}