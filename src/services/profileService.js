import {
  adminGet,
  adminPost,
  adminPut,
  adminDelete,
} from "./adminApiClient";

export async function getProfile() {
  return adminGet("/api/v1/users/me");
}

export async function updateProfile(data) {
  return adminPut("/api/v1/users/me", data);
}

export async function uploadAvatar(file) {
  const fd = new FormData();
  fd.append("file", file);
  return adminPost("/api/v1/users/me/photo", fd);
}

export async function removeAvatar() {
  return adminDelete("/api/v1/users/me/photo");
}

export async function changePassword(current, next) {
  try {
    return await adminPost("/api/v1/auth/change-password", {
      currentPassword: current,
      newPassword: next,
    });
  } catch {
    // Fallback endpoint
    return await adminPost("/api/v1/users/me/change-password", {
      currentPassword: current,
      newPassword: next,
    });
  }
}

export async function deactivateAccount(password) {
  return adminPost("/api/v1/users/me/deactivate", { password });
}