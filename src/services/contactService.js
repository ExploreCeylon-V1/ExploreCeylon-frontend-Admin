import {
  adminGet,
  adminPost,
  adminPatch,
  adminDelete,
} from "./adminApiClient";

export async function getAllMessages() {
  return adminGet("/api/v1/contact/admin");
}

export async function getUnreadMessages() {
  return adminGet("/api/v1/contact/admin/unread");
}

export async function getUnreadCount() {
  try {
    const data = await adminGet("/api/v1/contact/admin/count");
    return data.unread ?? 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(id) {
  return adminPatch(`/api/v1/contact/admin/${id}/read`);
}

export async function saveReply(id, reply) {
  return adminPost(`/api/v1/contact/admin/${id}/reply`, { reply });
}

export async function deleteMessage(id) {
  return adminDelete(`/api/v1/contact/admin/${id}`);
}
