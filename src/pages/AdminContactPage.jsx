// src/pages/AdminContactPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getAllMessages,
  getUnreadMessages,
  markAsRead,
  saveReply,
  deleteMessage,
} from "../services/contactService";

// ── Helpers ────────────────────────────────────────────────
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
    // Mount-only timer: `onClose` is a fresh inline function from the
    // parent on every render, so including it would restart the 3s
    // countdown on every parent re-render instead of firing once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      className="fixed top-5 right-5 z-50 bg-white border border-gray-200
                    rounded-2xl shadow-xl px-5 py-3 text-sm text-gray-800
                    font-medium flex items-center gap-2"
    >
      ✅ {msg}
    </div>
  );
}

// ── Message List Item ──────────────────────────────────────
function MessageItem({ msg, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3.5 cursor-pointer transition-all relative
                  border-b border-gray-100 last:border-0
                  ${
                    isSelected
                      ? "bg-green-50 border-l-4 border-l-[#1a5c2a]"
                      : "hover:bg-gray-50"
                  }
                  ${!msg.isRead && !isSelected ? "bg-blue-50/40" : ""}`}
    >
      {/* Unread dot */}
      {!msg.isRead && (
        <div
          className="absolute top-4 right-3 w-2 h-2
                        bg-[#1a5c2a] rounded-full"
        />
      )}

      <div className="flex items-start gap-3 pr-4">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-[#1a5c2a] flex items-center
                        justify-center text-white text-sm font-bold flex-shrink-0"
        >
          {msg.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p
              className={`text-sm truncate
                          ${
                            !msg.isRead
                              ? "font-bold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
            >
              {msg.name}
            </p>
            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
              {timeAgo(msg.createdAt)}
            </span>
          </div>

          <p className="text-xs text-gray-400 truncate mb-0.5">{msg.email}</p>

          {msg.subject && (
            <p className="text-xs font-medium text-gray-600 truncate">
              {msg.subject}
            </p>
          )}

          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
            {msg.message}
          </p>

          <div className="flex gap-1.5 mt-1.5">
            {msg.adminReply && (
              <span
                className="text-[10px] bg-green-100 text-green-700
                               font-semibold px-2 py-0.5 rounded-full"
              >
                ✓ Replied
              </span>
            )}
            {!msg.isRead && (
              <span
                className="text-[10px] bg-blue-100 text-blue-700
                               font-semibold px-2 py-0.5 rounded-full"
              >
                New
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Message Detail ─────────────────────────────────────────
function MessageDetail({ msg, onReply, onDelete, replying, deleting }) {
  const [replyText, setReplyText] = useState(msg.adminReply || "");

  // Reset the draft reply when a different message is selected, or when its
  // saved reply changes underneath us. Adjusted directly during render
  // (React's recommended pattern) instead of in an effect.
  const [trackedReply, setTrackedReply] = useState({ id: msg.id, adminReply: msg.adminReply });
  if (trackedReply.id !== msg.id || trackedReply.adminReply !== msg.adminReply) {
    setTrackedReply({ id: msg.id, adminReply: msg.adminReply });
    setReplyText(msg.adminReply || "");
  }

  const mailtoHref =
    `mailto:${msg.email}` +
    `?subject=Re: ${msg.subject || "Your message to ExploreCeylon"}` +
    `&body=${encodeURIComponent(replyText)}`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full bg-[#1a5c2a] flex items-center
                            justify-center text-white font-bold text-lg"
            >
              {msg.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900">{msg.name}</p>
              <a
                href={`mailto:${msg.email}`}
                className="text-xs text-[#1a5c2a] hover:underline"
              >
                {msg.email}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">
              {formatDate(msg.createdAt)}
            </span>
            <button
              onClick={() => onDelete(msg.id)}
              disabled={deleting}
              title="Delete"
              className="p-1.5 text-gray-400 hover:text-red-500
                         hover:bg-red-50 rounded-lg transition-colors
                         disabled:opacity-40"
            >
              {deleting ? "…" : "🗑"}
            </button>
          </div>
        </div>

        {msg.subject && (
          <div className="mt-3 bg-gray-50 rounded-xl px-4 py-2.5">
            <p className="text-[10px] text-gray-400 font-semibold mb-0.5">
              SUBJECT
            </p>
            <p className="text-sm font-semibold text-gray-800">{msg.subject}</p>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Message */}
        <div>
          <p
            className="text-[10px] font-semibold text-gray-400 uppercase
                        tracking-wide mb-2"
          >
            Message
          </p>
          <div
            className="bg-gray-50 rounded-2xl p-4 text-sm text-gray-700
                          leading-relaxed whitespace-pre-wrap"
          >
            {msg.message}
          </div>
        </div>

        {/* Previous reply */}
        {msg.adminReply && (
          <div>
            <p
              className="text-[10px] font-semibold text-[#1a5c2a] uppercase
                          tracking-wide mb-2"
            >
              Your Reply
              {msg.repliedAt && (
                <span className="ml-2 text-gray-400 normal-case font-normal">
                  · {formatDate(msg.repliedAt)}
                </span>
              )}
            </p>
            <div
              className="bg-green-50 border border-green-200 rounded-2xl
                            p-4 text-sm text-green-800 leading-relaxed
                            whitespace-pre-wrap"
            >
              {msg.adminReply}
            </div>
          </div>
        )}
      </div>

      {/* Reply box */}
      <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-500 mb-2">
          {msg.adminReply ? "Update Reply" : "Write a Reply"}
        </p>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={4}
          placeholder={`Hi ${msg.name.split(" ")[0]}, thank you for reaching out...`}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                     outline-none focus:border-[#1a5c2a] focus:ring-2
                     focus:ring-green-100 resize-none bg-white mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onReply(msg.id, replyText)}
            disabled={replying || !replyText.trim()}
            className="flex-1 py-2.5 bg-[#1a5c2a] hover:bg-[#14471f] text-white
                       rounded-xl text-sm font-semibold transition-colors
                       disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {replying ? (
              <>
                <span
                  className="w-4 h-4 border-2 border-white/30
                                   border-t-white rounded-full animate-spin"
                />
                Saving…
              </>
            ) : (
              "💾 Save Reply"
            )}
          </button>
          <a
            href={mailtoHref}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm
                       font-semibold text-gray-600 text-center
                       hover:border-[#1a5c2a] hover:text-[#1a5c2a]
                       transition-colors"
          >
            📧 Open in Email
          </a>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════
export default function AdminContactPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const data =
        filter === "unread"
          ? await getUnreadMessages()
          : await getAllMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error?.message === "Unauthorized"
          ? "Session expired. Please sign in again."
          : "Failed to load messages";
      showToast(message);
      if (error?.message === "Unauthorized") {
        logout("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [filter, logout]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // Fetch-guard: bail out and clear stale data when logged out. This is
      // part of the same data-fetching effect as the loadMessages() call
      // below, not state derived purely from render inputs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setLoading(false);
      return;
    }
    loadMessages();
  }, [filter, authLoading, isAuthenticated, loadMessages]);

  async function handleSelect(msg) {
    setSelected(msg);
    if (!msg.isRead) {
      try {
        const updated = await markAsRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m)),
        );
        setSelected(updated);
      } catch {
        // Best-effort: the message is still selected/readable even if the
        // "mark as read" call fails, so there's nothing to surface here.
      }
    }
  }

  async function handleReply(id, text) {
    setReplying(true);
    try {
      const updated = await saveReply(id, text);
      setSelected(updated);
      setMessages((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m)),
      );
      showToast("Reply saved!");
    } catch {
      showToast("Failed to save reply");
    } finally {
      setReplying(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this message permanently?")) return;
    setDeleting(true);
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast("Message deleted");
    } catch {
      showToast("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;

  const filtered = messages.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.subject || "").toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div
        className="bg-white border-b border-gray-200 px-6 py-4 flex
                      items-center justify-between gap-4 flex-wrap flex-shrink-0"
      >
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            ✉️ Contact Messages
            {unreadCount > 0 && (
              <span
                className="text-xs bg-red-500 text-white font-bold
                               px-2 py-0.5 rounded-full"
              >
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            From the website contact form
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              ["all", `All (${messages.length})`],
              ["unread", `Unread (${unreadCount})`],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold
                            transition-colors
                            ${
                              filter === key
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={loadMessages}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm
                       text-gray-600 hover:bg-gray-50 transition-colors"
          >
            🔄
          </button>
        </div>
      </div>

      {/* ── Split view ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — list */}
        <div
          className={`w-full md:w-80 flex-shrink-0 bg-white border-r border-gray-200
                        flex-col overflow-hidden ${selected ? "hidden md:flex" : "flex"}`}
        >
          {/* Search */}
          <div className="p-3 border-b border-gray-100 flex-shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2
                         text-sm outline-none focus:border-[#1a5c2a]
                         focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-16">
                <div
                  className="w-8 h-8 border-4 border-green-100
                                border-t-[#1a5c2a] rounded-full animate-spin"
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">
                  {search ? "No results found" : "No messages yet"}
                </p>
              </div>
            ) : (
              filtered.map((msg) => (
                <MessageItem
                  key={msg.id}
                  msg={msg}
                  isSelected={selected?.id === msg.id}
                  onClick={() => handleSelect(msg)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right — detail */}
        <div className={`flex-1 bg-white overflow-hidden flex-col ${selected ? "flex" : "hidden md:flex"}`}>
          {selected ? (
            <>
              <div className="md:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center">
                <button onClick={() => setSelected(null)} className="text-xs font-semibold text-[#1a5c2a] hover:underline flex items-center gap-1">
                  ← Back to messages
                </button>
              </div>
              <MessageDetail
                msg={selected}
                onReply={handleReply}
                onDelete={handleDelete}
                replying={replying}
                deleting={deleting}
              />
            </>
          ) : (
            <div
              className="flex flex-col items-center justify-center
                            h-full text-gray-400"
            >
              <p className="text-5xl mb-3">✉️</p>
              <p className="text-sm font-medium text-gray-600">
                Select a message to read
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {filtered.length} message{filtered.length !== 1 ? "s" : ""}{" "}
                total
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
