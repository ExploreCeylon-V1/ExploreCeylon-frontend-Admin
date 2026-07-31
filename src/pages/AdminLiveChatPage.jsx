// src/pages/AdminLiveChatPage.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import {
  getAllConversations,
  getConversationMessages,
  replyInConversation,
  markConversationRead,
} from "../services/chatService";
import { connectAdminChatSocket, subscribeToConversation } from "../services/chatSocket";

// ── Helpers ────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Conversation list item ──────────────────────────────────
function ConversationItem({ conv, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer border-b border-gray-100 px-4 py-3.5 transition-all last:border-0
        ${isSelected ? "border-l-4 border-l-[#1a5c2a] bg-green-50" : "hover:bg-gray-50"}
        ${conv.unreadByAdmin && !isSelected ? "bg-blue-50/40" : ""}`}
    >
      {conv.unreadByAdmin && (
        <div className="absolute right-3 top-4 h-2 w-2 rounded-full bg-[#1a5c2a]" />
      )}
      <div className="flex items-start gap-3 pr-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a5c2a] text-sm font-bold text-white">
          {conv.travelerName?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between gap-1">
            <p className={`truncate text-sm ${conv.unreadByAdmin ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
              {conv.travelerName}
            </p>
            <span className="flex-shrink-0 whitespace-nowrap text-[10px] text-gray-400">
              {timeAgo(conv.lastMessageAt)}
            </span>
          </div>
          <p className="mb-0.5 truncate text-xs text-gray-400">{conv.travelerEmail}</p>
          <p className="line-clamp-1 text-xs text-gray-500">
            {conv.lastMessage || "No messages yet"}
          </p>
          {conv.unreadByAdmin && (
            <span className="mt-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              New
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function AdminLiveChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef(null);
  const subRef = useRef(null);
  const scrollRef = useRef(null);
  const selectedIdRef = useRef(null);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      // best-effort load
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch on mount/when the callback identity changes.
  // loadConversations() sets state synchronously (setLoading(true)) before
  // its first await, which the linter can't distinguish from a risky
  // render loop — this is the standard "fetch on mount" effect pattern.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadConversations(); }, [loadConversations]);

  // One socket for the whole page: admin inbox updates conversation previews live,
  // and (once connected) we can subscribe to whichever conversation is open.
  useEffect(() => {
    const client = connectAdminChatSocket({
      onConnect: () => setConnected(true),
      onInboxUpdate: (conv) => {
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          const next = exists ? prev.map((c) => (c.id === conv.id ? conv : c)) : [conv, ...prev];
          return [...next].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        });
        if (conv.id === selectedIdRef.current && conv.unreadByAdmin) {
          markConversationRead(conv.id).catch(() => {});
        }
      },
    });
    clientRef.current = client;
    return () => client.deactivate();
  }, []);

  // Subscribe to the open conversation's live messages.
  useEffect(() => {
    subRef.current?.unsubscribe();
    if (!connected || !selectedId) return;
    subRef.current = subscribeToConversation(clientRef.current, selectedId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      if (msg.senderRole === "TRAVELER") {
        markConversationRead(selectedId).catch(() => {});
      }
    });
    return () => subRef.current?.unsubscribe();
  }, [connected, selectedId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function handleSelect(conv) {
    setSelectedId(conv.id);
    setMessages([]);
    setMessagesLoading(true);
    try {
      const msgs = await getConversationMessages(conv.id);
      setMessages(msgs);
      if (conv.unreadByAdmin) {
        await markConversationRead(conv.id);
        setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unreadByAdmin: false } : c)));
      }
    } catch {
      // best-effort
    } finally {
      setMessagesLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!draft.trim() || !selectedId || sending) return;
    setSending(true);
    const content = draft;
    setDraft("");
    try {
      const msg = await replyInConversation(selectedId, content);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setDraft(content);
    } finally {
      setSending(false);
    }
  }

  const unreadCount = conversations.filter((c) => c.unreadByAdmin).length;
  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.travelerName?.toLowerCase().includes(q) || c.travelerEmail?.toLowerCase().includes(q);
  });
  const selected = conversations.find((c) => c.id === selectedId) || null;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <MessageCircle size={18} className="text-[#1a5c2a]" />
            Live Chat
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-gray-300"}`} />
            {connected ? "Live" : "Connecting…"} · Traveler support conversations
          </p>
        </div>
        <button
          onClick={loadConversations}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — conversation list */}
        <div className="flex w-80 flex-shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white">
          <div className="flex-shrink-0 border-b border-gray-100 p-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search travelers…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-[#1a5c2a]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="mb-2 text-3xl">💬</p>
                <p className="text-sm">{search ? "No results found" : "No conversations yet"}</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isSelected={selectedId === conv.id}
                  onClick={() => handleSelect(conv)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right — active thread */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          {selected ? (
            <>
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a5c2a] text-lg font-bold text-white">
                  {selected.travelerName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selected.travelerName}</p>
                  <a href={`mailto:${selected.travelerEmail}`} className="text-xs text-[#1a5c2a] hover:underline">
                    {selected.travelerEmail}
                  </a>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50/50 p-5">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">Loading…</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    No messages yet in this conversation
                  </div>
                ) : (
                  messages.map((m) => {
                    if (m.senderRole === "SYSTEM") {
                      return (
                        <div key={m.id} className="mx-auto max-w-[80%] rounded-2xl border border-green-100 bg-green-50/70 px-4 py-2.5 text-center text-xs text-green-900 shadow-sm">
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className="mt-1 text-[10px] text-green-700/60">{formatTime(m.createdAt)}</p>
                        </div>
                      );
                    }
                    const fromAdmin = m.senderRole === "ADMIN";
                    return (
                      <div key={m.id} className={`flex ${fromAdmin ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            fromAdmin ? "rounded-br-sm bg-[#1a5c2a] text-white" : "rounded-bl-sm bg-white text-gray-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={`mt-1 text-[10px] ${fromAdmin ? "text-white/70" : "text-gray-400"}`}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="flex flex-shrink-0 items-center gap-2 border-t border-gray-100 bg-gray-50/50 p-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a reply…"
                  className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1a5c2a] focus:ring-2 focus:ring-green-100"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a5c2a] text-white transition-colors hover:bg-[#14471f] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <MessageCircle size={48} className="mb-3" />
              <p className="text-sm font-medium text-gray-600">Select a conversation to reply</p>
              <p className="mt-1 text-xs text-gray-400">
                {filtered.length} conversation{filtered.length !== 1 ? "s" : ""} total
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
