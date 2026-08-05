import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearAuth,
} from "../utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// In-flight refresh promise to deduplicate concurrent 401/403 refresh requests
let refreshPromise = null;

/**
 * Execute silent token refresh via POST /api/v1/auth/refresh-token.
 * Deduplicates multiple concurrent refresh triggers using a single shared promise.
 */
export function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.reject(new Error("No refresh token available"));
  }

  if (!refreshPromise) {
    refreshPromise = window
      .fetch(`${API_BASE}/api/v1/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
      .then(async (res) => {
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.message || errBody.error || "Token refresh failed");
        }
        const data = await res.json();
        if (!data?.accessToken) {
          throw new Error("No access token in refresh response");
        }
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Core fetch wrapper for ExploreCeylon-frontend-admin.
 * Automatically attaches Authorization header, catches 401/403 responses,
 * performs silent token refresh, and retries the original request seamlessly.
 */
export async function adminFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const token = getAccessToken();

  const headers = {
    ...options.headers,
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestOptions = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await window.fetch(url, requestOptions);
  } catch (netErr) {
    throw new Error(netErr.message || "Network error. Please check your connection.");
  }

  // If 401 occurs on a protected endpoint and hasn't been retried yet
  const isAuthEndpoint = path.includes("/api/v1/auth/");
  if (
    response.status === 401 &&
    !isAuthEndpoint &&
    !options._retried
  ) {
    try {
      const newAccessToken = await refreshAccessToken();
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      return await adminFetch(path, {
        ...options,
        headers: retryHeaders,
        _retried: true,
      });
    } catch {
      clearAuth();
      if (typeof window !== "undefined" && window.location && window.location.pathname !== "/login") {
        try {
          window.location.href = "/login";
        } catch {
          // Ignore jsdom navigation limitations in test environments
        }
      }
      const errBody = await response.json().catch(() => ({}));
      throw new Error(
        errBody.error || errBody.message || `Session expired (${response.status})`
      );
    }
  }

  return response;
}

/**
 * GET request helper
 */
export async function adminGet(path, options = {}) {
  const response = await adminFetch(path, {
    cache: "no-store",
    ...options,
    method: "GET",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Mutation request helper (POST, PUT, PATCH, DELETE)
 */
export async function adminMutate(path, method = "POST", body, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (body !== undefined && !(body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await adminFetch(path, {
    ...options,
    method,
    headers,
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || errBody.message || `Request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

export async function adminPost(path, body, options = {}) {
  return adminMutate(path, "POST", body, options);
}

export async function adminPut(path, body, options = {}) {
  return adminMutate(path, "PUT", body, options);
}

export async function adminPatch(path, body, options = {}) {
  return adminMutate(path, "PATCH", body, options);
}

export async function adminDelete(path, options = {}) {
  return adminMutate(path, "DELETE", undefined, options);
}

/**
 * Query string builder helper
 */
export function buildQuery(params) {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "ALL") {
      query.append(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : "";
}
