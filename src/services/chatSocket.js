import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "../utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/**
 * Opens one STOMP-over-SockJS connection for the admin Live Chat page:
 * subscribes to the shared inbox (new/updated conversations) and, once a
 * conversation is opened, to that conversation's message stream.
 */
export function connectAdminChatSocket({ onInboxUpdate, onConnect }) {
  const token = getAccessToken();

  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws-chat?token=${encodeURIComponent(token)}`),
    reconnectDelay: 4000,
    onConnect: () => {
      client.subscribe("/topic/chat.admin-inbox", (frame) => {
        onInboxUpdate(JSON.parse(frame.body));
      });
      onConnect?.();
    },
  });

  client.activate();
  return client;
}

export function subscribeToConversation(client, conversationId, onMessage) {
  if (!client || !client.connected) return null;
  return client.subscribe(`/topic/chat.${conversationId}`, (frame) => {
    onMessage(JSON.parse(frame.body));
  });
}
