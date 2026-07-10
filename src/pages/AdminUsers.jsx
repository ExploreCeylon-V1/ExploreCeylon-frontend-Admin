import { useEffect, useState, useCallback } from "react";
import { X, ShieldCheck, ShieldOff, RotateCcw, Download } from "lucide-react";
import * as adminUserService from "../services/adminUserService";
import DataTable from "../components/admin/DataTable";
import SearchBar from "../components/admin/SearchBar";
import Pagination from "../components/admin/Pagination";
import StatusBadge from "../components/admin/StatusBadge";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import BulkActionBar from "../components/admin/BulkActionBar";
import { downloadCsv } from "../utils/csvExport";

const PAGE_SIZE = 15;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminUsers() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState("ALL");
  const [phoneVerifiedFilter, setPhoneVerifiedFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const [detailUser, setDetailUser] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { type, user }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingBulkAction, setPendingBulkAction] = useState(null); // "activate" | "deactivate"
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminUserService.getUsers({
        search,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        active: activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE",
        emailVerified: emailVerifiedFilter === "ALL" ? undefined : emailVerifiedFilter === "VERIFIED",
        phoneVerified: phoneVerifiedFilter === "ALL" ? undefined : phoneVerifiedFilter === "VERIFIED",
        sortBy,
        sortDir,
        page,
        size: PAGE_SIZE,
      });
      setPageData(data);
    } catch (err) {
      setError(err?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, activeFilter, emailVerifiedFilter, phoneVerifiedFilter, sortBy, sortDir, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 250); // debounce search/filter changes
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [search, roleFilter, activeFilter, emailVerifiedFilter, phoneVerifiedFilter]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const allOnPage = pageData.content.every((u) => prev.has(u.id));
      const next = new Set(prev);
      pageData.content.forEach((u) => (allOnPage ? next.delete(u.id) : next.add(u.id)));
      return next;
    });
  };

  const runBulkAction = async (action) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await action();
      setPendingBulkAction(null);
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Bulk action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmBulkAction = () => {
    const ids = Array.from(selectedIds);
    if (pendingBulkAction === "activate") runBulkAction(() => adminUserService.bulkActivate(ids));
    else if (pendingBulkAction === "deactivate") runBulkAction(() => adminUserService.bulkDeactivate(ids));
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await adminUserService.getUsers({
        search,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        active: activeFilter === "ALL" ? undefined : activeFilter === "ACTIVE",
        emailVerified: emailVerifiedFilter === "ALL" ? undefined : emailVerifiedFilter === "VERIFIED",
        phoneVerified: phoneVerifiedFilter === "ALL" ? undefined : phoneVerifiedFilter === "VERIFIED",
        sortBy, sortDir, page: 0, size: 10000,
      });
      downloadCsv("users.csv", [
        { label: "Name", value: (u) => u.name },
        { label: "Email", value: (u) => u.email },
        { label: "Phone", value: (u) => u.phone },
        { label: "Role", value: (u) => u.role },
        { label: "Active", value: (u) => u.active },
        { label: "Email Verified", value: (u) => u.emailVerified },
        { label: "Phone Verified", value: (u) => u.phoneVerified },
        { label: "Trips", value: (u) => u.tripCount },
        { label: "Vehicle Bookings", value: (u) => u.vehicleBookingCount },
        { label: "Guide Bookings", value: (u) => u.guideBookingCount },
        { label: "Joined", value: (u) => u.createdAt },
        { label: "Last Login", value: (u) => u.lastLoginAt },
      ], data.content);
    } catch (err) {
      setActionError(err?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const runAction = async (action) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await action();
      setPendingAction(null);
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    if (type === "activate") runAction(() => adminUserService.activateUser(user.id));
    else if (type === "deactivate") runAction(() => adminUserService.deactivateUser(user.id));
    else if (type === "resetEmail") runAction(() => adminUserService.resetVerification(user.id, "EMAIL"));
    else if (type === "resetPhone") runAction(() => adminUserService.resetVerification(user.id, "PHONE"));
  };

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role) return;
    try {
      setActionError(null);
      await adminUserService.changeUserRole(user.id, newRole);
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Failed to change role");
    }
  };

  const columns = [
    {
      key: "name", label: "User", sortable: true,
      render: (u) => (
        <div>
          <p className="font-medium text-slate-900">{u.name}</p>
          <p className="text-xs text-slate-400">{u.email}</p>
        </div>
      ),
    },
    { key: "phone", label: "Phone", render: (u) => u.phone || "—" },
    {
      key: "role", label: "Role", sortable: true,
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => handleRoleChange(u, e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="TRAVELER">Traveler</option>
          <option value="ADMIN">Admin</option>
        </select>
      ),
    },
    { key: "active", label: "Status", render: (u) => <StatusBadge value={u.active ? "ACTIVE" : "INACTIVE"} /> },
    {
      key: "verification", label: "Verified",
      render: (u) => (
        <div className="flex gap-1">
          <StatusBadge value={u.emailVerified ? "VERIFIED" : "UNVERIFIED"} tone={u.emailVerified ? "green" : "slate"} />
          <StatusBadge value={u.phoneVerified ? "VERIFIED" : "UNVERIFIED"} tone={u.phoneVerified ? "green" : "slate"} />
        </div>
      ),
    },
    { key: "tripCount", label: "Trips", render: (u) => u.tripCount },
    { key: "bookings", label: "Bookings", render: (u) => u.vehicleBookingCount + u.guideBookingCount },
    { key: "createdAt", label: "Joined", sortable: true, render: (u) => formatDate(u.createdAt) },
    {
      key: "actions", label: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetailUser(u)} className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
          {u.active ? (
            <button onClick={() => setPendingAction({ type: "deactivate", user: u })} className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-medium">Deactivate</button>
          ) : (
            <button onClick={() => setPendingAction({ type: "activate", user: u })} className="px-2 py-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium">Activate</button>
          )}
        </div>
      ),
    },
  ];

  const confirmCopy = {
    activate: { title: "Activate this user?", message: "They will regain full access to their account.", confirmLabel: "Activate", tone: "green" },
    deactivate: { title: "Deactivate this user?", message: "They will be signed out and unable to log back in until reactivated.", confirmLabel: "Deactivate", tone: "red" },
    resetEmail: { title: "Reset email verification?", message: "The user will need to re-verify their email address.", confirmLabel: "Reset", tone: "red" },
    resetPhone: { title: "Reset phone verification?", message: "The user will need to re-verify their phone number.", confirmLabel: "Reset", tone: "red" },
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
              <p className="text-sm text-slate-500 mt-1">{pageData.totalElements} registered travelers and admins</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
            >
              <Download size={15} /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or phone..." />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Roles</option>
              <option value="TRAVELER">Traveler</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">Active & Inactive</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
            <select value={emailVerifiedFilter} onChange={(e) => setEmailVerifiedFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">Email: Any</option>
              <option value="VERIFIED">Email Verified</option>
              <option value="UNVERIFIED">Email Unverified</option>
            </select>
            <select value={phoneVerifiedFilter} onChange={(e) => setPhoneVerifiedFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">Phone: Any</option>
              <option value="VERIFIED">Phone Verified</option>
              <option value="UNVERIFIED">Phone Unverified</option>
            </select>
          </div>

          {actionError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between">
              <span>{actionError}</span><button onClick={() => setActionError(null)}><X size={16} /></button>
            </div>
          )}

          <BulkActionBar
            count={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            actions={[
              { label: "Activate", onClick: () => setPendingBulkAction("activate") },
              { label: "Deactivate", onClick: () => setPendingBulkAction("deactivate"), tone: "red" },
            ]}
          />

          <DataTable
            columns={columns}
            rows={pageData.content}
            loading={loading}
            error={error}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            emptyIcon="👤"
            emptyTitle="No users found"
            emptySubtitle="Try adjusting your search or filters."
            selectable
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
          />
          {!loading && !error && (
            <Pagination
              page={page}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              size={PAGE_SIZE}
              onPageChange={setPage}
            />
          )}
        </main>
      </div>

      {detailUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900">User Profile</h2>
              <button onClick={() => setDetailUser(null)} className="text-slate-400 hover:text-slate-600 p-1 transition"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                  {detailUser.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{detailUser.name}</p>
                  <p className="text-sm text-slate-500">{detailUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-400 text-xs uppercase mb-1">Role</p><StatusBadge value={detailUser.role} /></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Status</p><StatusBadge value={detailUser.active ? "ACTIVE" : "INACTIVE"} /></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Phone</p><p className="text-slate-700">{detailUser.phone || "—"}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Nationality</p><p className="text-slate-700">{detailUser.nationality || "—"}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Registered</p><p className="text-slate-700">{formatDate(detailUser.createdAt)}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Last Login</p><p className="text-slate-700">{formatDateTime(detailUser.lastLoginAt)}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Trips Created</p><p className="text-slate-700 font-semibold">{detailUser.tripCount}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Total Bookings</p><p className="text-slate-700 font-semibold">{detailUser.vehicleBookingCount + detailUser.guideBookingCount}</p></div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-slate-400 text-xs uppercase mb-2">Verification</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={detailUser.emailVerified ? "Email Verified" : "Email Unverified"} tone={detailUser.emailVerified ? "green" : "slate"} />
                  <StatusBadge value={detailUser.phoneVerified ? "Phone Verified" : "Phone Unverified"} tone={detailUser.phoneVerified ? "green" : "slate"} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {detailUser.emailVerified && (
                    <button onClick={() => setPendingAction({ type: "resetEmail", user: detailUser })} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                      <RotateCcw size={13} /> Reset Email Verification
                    </button>
                  )}
                  {detailUser.phoneVerified && (
                    <button onClick={() => setPendingAction({ type: "resetPhone", user: detailUser })} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                      <RotateCcw size={13} /> Reset Phone Verification
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                {detailUser.active ? (
                  <button onClick={() => setPendingAction({ type: "deactivate", user: detailUser })} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium">
                    <ShieldOff size={16} /> Deactivate
                  </button>
                ) : (
                  <button onClick={() => setPendingAction({ type: "activate", user: detailUser })} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-medium">
                    <ShieldCheck size={16} /> Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        loading={actionLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
        {...(pendingAction ? confirmCopy[pendingAction.type] : {})}
      />

      <ConfirmDialog
        open={!!pendingBulkAction}
        loading={actionLoading}
        title={pendingBulkAction === "activate" ? `Activate ${selectedIds.size} users?` : `Deactivate ${selectedIds.size} users?`}
        message={pendingBulkAction === "activate"
          ? "They will regain full access to their accounts."
          : "They will be signed out and unable to log back in until reactivated."}
        confirmLabel={pendingBulkAction === "activate" ? "Activate" : "Deactivate"}
        tone={pendingBulkAction === "activate" ? "green" : "red"}
        onCancel={() => setPendingBulkAction(null)}
        onConfirm={confirmBulkAction}
      />
    </div>
  );
}
