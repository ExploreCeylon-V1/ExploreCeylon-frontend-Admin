import { useEffect, useState, useCallback } from "react";
import { X, Car, Users as UsersIcon, MapPin, Download } from "lucide-react";
import * as adminBookingService from "../services/adminBookingService";
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

function TypeBadge({ type }) {
  const isVehicle = type === "VEHICLE";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isVehicle ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
      {isVehicle ? <Car size={12} /> : <UsersIcon size={12} />}
      {isVehicle ? "Vehicle" : "Guide"}
    </span>
  );
}

export default function AdminBookings() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const [detailBooking, setDetailBooking] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'cancel', booking }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set()); // Set of "TYPE-id" keys
  const [pendingBulkStatus, setPendingBulkStatus] = useState(null); // "CONFIRMED" | "COMPLETED" | "CANCELLED"
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminBookingService.getBookings({
        search,
        type: typeFilter,
        status: statusFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDir,
        page,
        size: PAGE_SIZE,
      });
      setPageData(data);
    } catch (err) {
      setError(err?.message ?? "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, dateFrom, dateTo, sortBy, sortDir, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  useEffect(() => {
    setPage(0);
    setSelectedIds(new Set());
  }, [search, typeFilter, statusFilter, dateFrom, dateTo]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // AdminBookingResponse.id is only unique per type (a VEHICLE booking and
  // a GUIDE booking can share the same numeric id) — key rows by type+id
  // for both React's list key and bulk-selection identity.
  const rows = pageData.content.map((b) => ({ ...b, _key: `${b.type}-${b.id}` }));

  const toggleRow = (key) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const allOnPage = rows.every((r) => prev.has(r._key));
      const next = new Set(prev);
      rows.forEach((r) => (allOnPage ? next.delete(r._key) : next.add(r._key)));
      return next;
    });
  };

  const runBulkStatus = async (status) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const items = rows
        .filter((r) => selectedIds.has(r._key))
        .map((r) => ({ type: r.type, id: r.id }));
      await adminBookingService.bulkUpdateStatus(items, status);
      setPendingBulkStatus(null);
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Bulk update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await adminBookingService.getBookings({
        search, type: typeFilter, status: statusFilter,
        dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
        sortBy, sortDir, page: 0, size: 10000,
      });
      downloadCsv("bookings.csv", [
        { label: "Type", value: (b) => b.type },
        { label: "Customer", value: (b) => b.customerName },
        { label: "Customer Email", value: (b) => b.customerEmail },
        { label: "Provider", value: (b) => b.providerName },
        { label: "Start Date", value: (b) => b.startDate },
        { label: "End Date", value: (b) => b.endDate },
        { label: "Total Cost", value: (b) => b.totalCost },
        { label: "Status", value: (b) => b.status },
        { label: "Trip ID", value: (b) => b.tripId },
        { label: "Created", value: (b) => b.createdAt },
      ], data.content);
    } catch (err) {
      setActionError(err?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const confirmCancel = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminBookingService.cancelBooking(pendingAction.booking.type, pendingAction.booking.id);
      setPendingAction(null);
      setDetailBooking(null);
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "type", label: "Type", render: (b) => <TypeBadge type={b.type} /> },
    {
      key: "customerName", label: "Customer", sortable: false,
      render: (b) => (
        <div>
          <p className="font-medium text-slate-900">{b.customerName}</p>
          <p className="text-xs text-slate-400">{b.customerEmail}</p>
        </div>
      ),
    },
    { key: "providerName", label: "Provider", render: (b) => b.providerName },
    { key: "startDate", label: "Dates", sortable: true, render: (b) => `${formatDate(b.startDate)} → ${formatDate(b.endDate)}` },
    { key: "totalCost", label: "Total", sortable: true, render: (b) => `$${b.totalCost?.toFixed(2)}` },
    { key: "status", label: "Status", sortable: true, render: (b) => <StatusBadge value={b.status} /> },
    {
      key: "actions", label: "Actions",
      render: (b) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetailBooking(b)} className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
          {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
            <button onClick={() => setPendingAction({ type: "cancel", booking: b })} className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-medium">Cancel</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Booking Management</h1>
              <p className="text-sm text-slate-500 mt-1">{pageData.totalElements} vehicle and guide bookings</p>
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
            <SearchBar value={search} onChange={setSearch} placeholder="Search by customer or provider..." />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Types</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="GUIDE">Guide</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Statuses</option>
              <option value="PENDING_PAYMENT">Pending Payment</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
              { label: "Mark Confirmed", onClick: () => setPendingBulkStatus("CONFIRMED") },
              { label: "Mark Completed", onClick: () => setPendingBulkStatus("COMPLETED") },
              { label: "Cancel Selected", onClick: () => setPendingBulkStatus("CANCELLED"), tone: "red" },
            ]}
          />

          <DataTable
            columns={columns}
            rows={rows}
            keyField="_key"
            loading={loading}
            error={error}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            emptyIcon="🧳"
            emptyTitle="No bookings found"
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

      {detailBooking && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900">Booking Details</h2>
              <button onClick={() => setDetailBooking(null)} className="text-slate-400 hover:text-slate-600 p-1 transition"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-2">
                <TypeBadge type={detailBooking.type} />
                <StatusBadge value={detailBooking.status} />
              </div>

              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">Customer</p>
                <p className="font-medium text-slate-900">{detailBooking.customerName}</p>
                <p className="text-sm text-slate-500">{detailBooking.customerEmail}</p>
              </div>

              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">Provider</p>
                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                  {detailBooking.type === "VEHICLE" ? <Car size={14} /> : <UsersIcon size={14} />}
                  {detailBooking.providerName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-400 text-xs uppercase mb-1">Start</p><p className="text-slate-700">{formatDate(detailBooking.startDate)}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">End</p><p className="text-slate-700">{formatDate(detailBooking.endDate)}</p></div>
                <div><p className="text-slate-400 text-xs uppercase mb-1">Total Cost</p><p className="text-slate-700 font-semibold">${detailBooking.totalCost?.toFixed(2)}</p></div>
                <div>
                  <p className="text-slate-400 text-xs uppercase mb-1">Related Trip</p>
                  {detailBooking.tripId ? (
                    <p className="text-slate-700">Trip #{detailBooking.tripId}</p>
                  ) : (
                    <p className="text-slate-400 flex items-center gap-1"><MapPin size={13} /> Not linked to a trip</p>
                  )}
                </div>
              </div>

              {detailBooking.status !== "CANCELLED" && detailBooking.status !== "COMPLETED" && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setPendingAction({ type: "cancel", booking: detailBooking })}
                    className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        loading={actionLoading}
        title="Cancel this booking?"
        message="The customer will be notified. This does not automatically issue a refund."
        confirmLabel="Cancel Booking"
        cancelLabel="Keep Booking"
        tone="red"
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmCancel}
      />

      <ConfirmDialog
        open={!!pendingBulkStatus}
        loading={actionLoading}
        title={`Update ${selectedIds.size} booking${selectedIds.size === 1 ? "" : "s"} to ${pendingBulkStatus}?`}
        message="This changes the booking status directly and does not process any payment or refund."
        confirmLabel="Update"
        tone={pendingBulkStatus === "CANCELLED" ? "red" : "green"}
        onCancel={() => setPendingBulkStatus(null)}
        onConfirm={() => runBulkStatus(pendingBulkStatus)}
      />
    </div>
  );
}
