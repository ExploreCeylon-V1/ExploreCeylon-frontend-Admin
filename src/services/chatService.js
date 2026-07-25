import { adminGet, adminMutate } from "./adminApiClient";

export const getAllConversations = () => adminGet("/api/v1/chat/admin/conversations");

export const getUnreadCount = () =>
  adminGet("/api/v1/chat/admin/unread-count").then((d) => d.unread ?? 0);

export const getConversationMessages = (id) =>
  adminGet(`/api/v1/chat/admin/conversations/${id}/messages`);

export const replyInConversation = (id, content) =>
  adminMutate(`/api/v1/chat/admin/conversations/${id}/messages`, "POST", { content });

export const markConversationRead = (id) =>
  adminMutate(`/api/v1/chat/admin/conversations/${id}/read`, "PATCH");
