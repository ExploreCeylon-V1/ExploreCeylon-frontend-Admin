// src/services/contactService.js
// Admin contact message service

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthHeader() {
  const token =
    localStorage.getItem("ec_admin_token") ||
    localStorage.getItem("exploreCeylonToken") ||
    localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getAllMessages() {
  const res = await fetch(`${API_BASE}/api/v1/contact/admin`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function getUnreadMessages() {
  const res = await fetch(`${API_BASE}/api/v1/contact/admin/unread`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to fetch unread");
  return res.json();
}

export async function getUnreadCount() {
  const res = await fetch(`${API_BASE}/api/v1/contact/admin/count`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unread ?? 0;
}

export async function markAsRead(id) {
  const res = await fetch(`${API_BASE}/api/v1/contact/admin/${id}/read`, {
    method: "PATCH",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to mark as read");
  return res.json();
}

export async function saveReply(id, reply) {
  const res = await fetch(`${API_BASE}/api/v1/contact/admin/${id}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw new Error("Failed to save reply");
  return res.json();
}

export async function deleteMessage(id) {
  const res = await fetch(`${API_BASE}/api/v1/contact/admin/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete");
}
