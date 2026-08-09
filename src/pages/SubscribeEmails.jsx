import { useCallback, useEffect, useState, useMemo } from "react";
import {
  getSubscribeEmails,
  markEmailAsAdded,
  markEmailAsNotAdded,
  deleteSubscribeEmail,
} from "../services/subscribeEmailService";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import { Mail, Search, CheckCircle2, Clock, Trash2, UserCheck, UserX, RefreshCw } from "lucide-react";

function formatDate(d) {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl px-5 py-3 text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
      <CheckCircle2 size={18} className="text-emerald-400" />
      <span>{msg}</span>
    </div>
  );
}

export default function SubscribeEmails() {
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'added' | 'not-added'
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = useCallback(async (tabStatus) => {
    setLoading(true);
    try {
      const data = await getSubscribeEmails(tabStatus || activeTab);
      setEmails(data || []);
    } catch (err) {
      console.error("Failed to fetch subscribe emails:", err);
      setToastMsg("Failed to load subscription list.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
    loadData(activeTab);
  }, [activeTab, loadData]);

  // Client-side search filtering
  const filteredEmails = useMemo(() => {
    if (!search.trim()) return emails;
    const query = search.trim().toLowerCase();
    return emails.filter((item) => item.email?.toLowerCase().includes(query));
  }, [emails, search]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEmails.length / pageSize) || 1;
  const paginatedEmails = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmails.slice(start, start + pageSize);
  }, [filteredEmails, currentPage, pageSize]);

  const handleMarkAdded = async (item) => {
    setActionLoadingId(item.id);
    try {
      await markEmailAsAdded(item.id);
      setToastMsg(`Marked ${item.email} as Added to Group`);
      await loadData();
    } catch (err) {
      console.error("Mark added failed:", err);
      setToastMsg("Failed to mark as added.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkNotAdded = async (item) => {
    setActionLoadingId(item.id);
    try {
      await markEmailAsNotAdded(item.id);
      setToastMsg(`Removed ${item.email} from Group`);
      await loadData();
    } catch (err) {
      console.error("Mark not-added failed:", err);
      setToastMsg("Failed to update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubscribeEmail(deleteTarget.id);
      setToastMsg(`Permanently deleted ${deleteTarget.email}`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error("Delete subscriber failed:", err);
      setToastMsg("Failed to delete subscriber record.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toastMsg && <Toast msg={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-emerald-600" />
            <span>Newsletter Subscribers</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage traveler email subscriptions and track external group marketing status.
          </p>
        </div>

        <button
          onClick={() => loadData(activeTab)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* 3 Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: "all", label: "All Subscribers" },
            { id: "added", label: "Added Emails" },
            { id: "not-added", label: "Not Added Emails" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  active
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search email..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading subscribers list...</span>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No subscribers found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {search
                ? `No email matches "${search}".`
                : "No email subscribers found in this category."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">Subscriber Email</th>
                  <th className="px-6 py-4">Subscribed Date</th>
                  <th className="px-6 py-4">Group Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedEmails.map((item) => {
                  const isActioning = actionLoadingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Email */}
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.email}
                      </td>

                      {/* Subscribed Date */}
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(item.subscribedAt)}</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.addedToGroup ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Added to Group</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>Not Added</span>
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {item.addedToGroup ? (
                            <button
                              disabled={isActioning}
                              onClick={() => handleMarkNotAdded(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-3xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5 text-slate-500" />
                              <span>Remove from Group</span>
                            </button>
                          ) : (
                            <button
                              disabled={isActioning}
                              onClick={() => handleMarkAdded(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-3xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Mark as Added</span>
                            </button>
                          )}

                          <button
                            disabled={isActioning}
                            onClick={() => setDeleteTarget(item)}
                            title="Delete Subscriber"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer / Pagination Controls */}
        {!loading && filteredEmails.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold text-slate-900">
                {Math.min(currentPage * pageSize, filteredEmails.length)}
              </span>{" "}
              of <span className="font-semibold text-slate-900">{filteredEmails.length}</span> subscribers
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <span className="text-xs font-semibold text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Subscriber Record?"
        message={`Are you sure you want to permanently delete ${deleteTarget?.email}? This action cannot be undone.`}
        confirmLabel="Delete Subscriber"
        cancelLabel="Cancel"
        tone="red"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
