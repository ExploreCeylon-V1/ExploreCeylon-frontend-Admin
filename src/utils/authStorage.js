export const TOKEN_KEY = "ec_admin_token";
export const REFRESH_TOKEN_KEY = "ec_admin_refresh_token";
export const USER_KEY = "ec_admin_user";

/**
 * Persist access token, user, and refresh token in localStorage.
 * Standardizes storage under ec_admin_* keys while clearing legacy keys.
 */
export function saveAuth(token, user, refreshToken = null) {
  clearAuth();
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Get access token from localStorage (checking ec_admin_token first,
 * with legacy key fallback for backward compatibility).
 */
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem("exploreCeylonToken") ||
    localStorage.getItem("token") ||
    null
  );
}

/**
 * Get stored refresh token.
 */
export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
}

/**
 * Swap in a freshly-issued access token.
 */
export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get parsed user object from localStorage.
 */
export function getUser() {
  if (typeof window === "undefined") return null;
  const raw =
    localStorage.getItem(USER_KEY) ||
    localStorage.getItem("exploreCeylonUser") ||
    localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Merge partial user updates into the stored user object.
 */
export function updateStoredUser(partial) {
  const current = getUser() || {};
  const updated = { ...current, ...partial };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Wipe all authentication tokens and user data from localStorage.
 */
export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("exploreCeylonToken");
  localStorage.removeItem("exploreCeylonUser");
  localStorage.removeItem("exploreCeylonRole");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
