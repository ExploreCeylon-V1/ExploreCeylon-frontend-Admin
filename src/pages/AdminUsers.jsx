import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
  const [password, setPassword] = useState("");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingBulkAction, setPendingBulkAction] = useState(null); // "activate" | "deactivate"
  const [bulkPassword, setBulkPassword] = useState("");
  const [exporting, setExporting] = useState(false);

  // Actions that need the acting admin's own password re-confirmed.
  const PASSWORD_GATED_TYPES = new Set(["activate", "deactivate", "changeRole"]);

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

  // Reset pagination/selection when the filters change. Adjusted directly
  // during render (React's recommended pattern for "derived state that
  // resets on prop/state change") instead of in an effect, so it doesn't
  // cost an extra render pass.
  const filterKey = JSON.stringify([search, roleFilter, activeFilter, emailVerifiedFilter, phoneVerifiedFilter]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
    setSelectedIds(new Set());
  }

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
      setBulkPassword("");
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
    if (pendingBulkAction === "activate") runBulkAction(() => adminUserService.bulkActivate(ids, bulkPassword));
    else if (pendingBulkAction === "deactivate") runBulkAction(() => adminUserService.bulkDeactivate(ids, bulkPassword));
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
      setPassword("");
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    const { type, user, newRole } = pendingAction;
    if (type === "activate") runAction(() => adminUserService.activateUser(user.id, password));
    else if (type === "deactivate") runAction(() => adminUserService.deactivateUser(user.id, password));
    else if (type === "resetEmail") runAction(() => adminUserService.resetVerification(user.id, "EMAIL"));
    else if (type === "resetPhone") runAction(() => adminUserService.resetVerification(user.id, "PHONE"));
    else if (type === "changeRole") runAction(() => adminUserService.changeUserRole(user.id, newRole, password));
  };

  const handleRoleChange = (user, newRole) => {
    if (newRole === user.role) return;
    // Granting or revoking admin access is high-stakes — confirm before committing,
    // rather than firing on a raw <select> change (one mis-click away otherwise).
    setPendingAction({ type: "changeRole", user, newRole });
  };

  const columns = [
    {
      key: "name", label: "User", sortable: true,
      render: (u) => (
        <div className="min-w-0">
          <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{u.name}</p>
          <p className="text-xs text-slate-400 truncate">{u.email}</p>
        </div>
      ),
    },
    { key: "phone", label: "Phone", hideOnMobile: true, render: (u) => u.phone || "—" },
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
      key: "verification", label: "Verified", hideOnMobile: true,
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge value={u.emailVerified ? "EMAIL" : "NO EMAIL"} tone={u.emailVerified ? "green" : "slate"} />
          <StatusBadge value={u.phoneVerified ? "PHONE" : "NO PHONE"} tone={u.phoneVerified ? "green" : "slate"} />
          <StatusBadge
            value={u.kycStatus ? `ID: ${u.kycStatus}` : "ID: NONE"}
            tone={u.kycStatus === "APPROVED" ? "green" : u.kycStatus === "PENDING" ? "amber" : u.kycStatus === "REJECTED" ? "red" : "slate"}
          />
        </div>
      ),
    },
    { key: "tripCount", label: "Trips", hideOnTablet: true, render: (u) => u.tripCount },
    { key: "bookings", label: "Bookings", hideOnTablet: true, render: (u) => u.vehicleBookingCount + u.guideBookingCount },
    { key: "createdAt", label: "Joined", hideOnTablet: true, sortable: true, render: (u) => formatDate(u.createdAt) },
    {
      key: "actions", label: "Actions",
      render: (u) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetailUser(u)} className="px-1.5 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
          {u.active ? (
            <button onClick={() => setPendingAction({ type: "deactivate", user: u })} className="px-1.5 py-1 text-xs text-red-500 hover:text-red-700 font-medium">Deactivate</button>
          ) : (
            <button onClick={() => setPendingAction({ type: "activate", user: u })} className="px-1.5 py-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium">Activate</button>
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
    changeRole:
      pendingAction?.newRole === "ADMIN"
        ? { title: "Grant admin access?", message: `${pendingAction?.user?.name} will get full access to the admin panel — user management, bookings, content, everything.`, confirmLabel: "Make Admin", tone: "red" }
        : { title: "Revoke admin access?", message: `${pendingAction?.user?.name} will be downgraded to a regular traveler account.`, confirmLabel: "Revoke Admin", tone: "red" },
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">User Management</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageData.totalElements} registered travelers and admins</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60 self-start sm:self-auto"
            >
              <Download size={15} /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or phone..." />
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="ALL">All Roles</option>
                  <option value="TRAVELER">Traveler</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="ALL">Active & Inactive</option>
                  <option value="ACTIVE">Active only</option>
                  <option value="INACTIVE">Inactive only</option>
                </select>
                <select value={emailVerifiedFilter} onChange={(e) => setEmailVerifiedFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="ALL">Email: Any</option>
                  <option value="VERIFIED">Email Verified</option>
                  <option value="UNVERIFIED">Email Unverified</option>
                </select>
                <select value={phoneVerifiedFilter} onChange={(e) => setPhoneVerifiedFilter(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="ALL">Phone: Any</option>
                  <option value="VERIFIED">Phone Verified</option>
                  <option value="UNVERIFIED">Phone Unverified</option>
                </select>
              </div>
            </div>
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
                  <StatusBadge
                    value={
                      detailUser.kycStatus === "APPROVED"
                        ? "ID Approved"
                        : detailUser.kycStatus === "PENDING"
                        ? "ID Pending Review"
                        : detailUser.kycStatus === "REJECTED"
                        ? "ID Rejected"
                        : "ID Not Submitted"
                    }
                    tone={
                      detailUser.kycStatus === "APPROVED"
                        ? "green"
                        : detailUser.kycStatus === "PENDING"
                        ? "amber"
                        : detailUser.kycStatus === "REJECTED"
                        ? "red"
                        : "slate"
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    to={`/approvals?search=${encodeURIComponent(detailUser.email)}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded-lg font-medium transition-colors"
                  >
                    <ShieldCheck size={13} /> View in ID Approvals →
                  </Link>
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
        onCancel={() => { setPendingAction(null); setPassword(""); setActionError(null); }}
        onConfirm={confirmPendingAction}
        requirePassword={pendingAction && PASSWORD_GATED_TYPES.has(pendingAction.type)}
        password={password}
        onPasswordChange={setPassword}
        passwordError={pendingAction && PASSWORD_GATED_TYPES.has(pendingAction.type) ? actionError : null}
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
        onCancel={() => { setPendingBulkAction(null); setBulkPassword(""); setActionError(null); }}
        onConfirm={confirmBulkAction}
        requirePassword
        password={bulkPassword}
        onPasswordChange={setBulkPassword}
        passwordError={actionError}
      />
    </div>
  );
}
