import {
  saveAuth,
  clearAuth,
  getAccessToken,
  getUser as getStoredUser,
} from "../utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
    throw new Error(data?.message || data?.error || "Login failed");
  }

  const userData = {
    id: data.userId,
    name: data.name,
    email: data.email,
    role: data.role,
    avatarUrl: data.avatarUrl,
  };

  saveAuth(data.accessToken, userData, data.refreshToken);
  return data;
}

export function logout() {
  clearAuth();
}

export function getToken() {
  return getAccessToken();
}

export function getUser() {
  return getStoredUser();
}

export function getRole() {
  const user = getUser();
  return user?.role || null;
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