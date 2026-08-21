import { useEffect, useState, useCallback } from "react";
import {
  X, Car, Users as UsersIcon, Calendar, DollarSign, Clock, AlertTriangle,
  CheckCircle2, Bell, ExternalLink, RefreshCw, ChevronRight, MapPin, Phone, Mail, User, ShieldAlert,
  Send, MessageSquare
} from "lucide-react";
import * as adminPaymentService from "../services/adminPaymentService";
import DataTable from "../components/admin/DataTable";
import SearchBar from "../components/admin/SearchBar";
import Pagination from "../components/admin/Pagination";
import StatTile from "../components/admin/StatTile";
import StatusBadge from "../components/admin/StatusBadge";

const PAGE_SIZE = 15;
const MAX_MESSAGE_LENGTH = 500;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  if (amount == null) return "$0.00";
  return `$${Number(amount).toFixed(2)}`;
}

function TypeBadge({ type }) {
  const isVehicle = type === "VEHICLE";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isVehicle ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
    }`}>
      {isVehicle ? <Car size={12} /> : <UsersIcon size={12} />}
      {isVehicle ? "Vehicle" : "Guide"}
    </span>
  );
}

function CompletionBadge({ completion, isOverdue }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
        <AlertTriangle size={12} />
        20% (Overdue)
      </span>
    );
  }
  if (completion === "100%") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 size={12} />
        100% Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
      <Clock size={12} />
      20% Deposit
    </span>
  );
}

export default function AdminPayments() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [summary, setSummary] = useState({
    totalRevenueCollected: 0,
    partial20Count: 0,
    full100Count: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [completionFilter, setCompletionFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  // Drawer & Modals
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Custom Message Reminder Modal
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [paged, sum] = await Promise.all([
        adminPaymentService.getPayments({
          search,
          type: typeFilter,
          completionStatus: completionFilter,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          sortBy,
          sortDir,
          page,
          size: PAGE_SIZE,
        }),
        adminPaymentService.getPaymentSummary(),
      ]);
      setPageData(paged);
      if (sum) setSummary(sum);
    } catch (err) {
      setError(err?.message ?? "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, completionFilter, dateFrom, dateTo, sortBy, sortDir, page]);

  useEffect(() => {
    const timeout = setTimeout(loadData, 250);
    return () => clearTimeout(timeout);
  }, [loadData]);

  // Reset page when filters change
  const filterKey = JSON.stringify([search, typeFilter, completionFilter, dateFrom, dateTo]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const handleOpenDetail = async (row) => {
    setSelectedPayment(row);
    setDetailLoading(true);
    setNotifyMessage(null);
    try {
      const detail = await adminPaymentService.getPaymentDetail(row.bookingType, row.bookingId);
      setDetailData(detail);
    } catch (err) {
      console.error("Failed to load payment detail", err);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenNotifyModal = () => {
    if (!detailData) return;
    const prefix = detailData.bookingType === "VEHICLE" ? "VBK" : "GBK";
    const defaultMsg = `Your remaining 80% payment of ${formatCurrency(detailData.remainingBalance)} for booking #${prefix}-${detailData.bookingId} is still pending. Please complete the outstanding payment to settle your booking.`;
    setCustomMessage(defaultMsg);
    setNotifyModalOpen(true);
  };

  const handleSendNotification = async (e) => {
    if (e) e.preventDefault();
    if (!detailData || !customMessage.trim() || notifyLoading) return;
    try {
      setNotifyLoading(true);
      const res = await adminPaymentService.notifyOverdueUser(
        detailData.bookingType,
        detailData.bookingId,
        customMessage.trim()
      );
      setNotifyMessage({
        type: res?.success ? "success" : "info",
        text: res?.message || "Notification processed.",
      });
      // Refresh detail data
      const updated = await adminPaymentService.getPaymentDetail(detailData.bookingType, detailData.bookingId);
      setDetailData(updated);
      // Also refresh summary and table
      loadData();
      setNotifyModalOpen(false);
    } catch (err) {
      setNotifyMessage({
        type: "error",
        text: err?.message || "Failed to dispatch payment reminder notification.",
      });
      setNotifyModalOpen(false);
    } finally {
      setNotifyLoading(false);
    }
  };

  const columns = [
    {
      key: "bookingId",
      label: "Booking ID",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-800">
            #{r.bookingType === "VEHICLE" ? "VBK" : "GBK"}-{r.bookingId}
          </span>
        </div>
      ),
    },
    {
      key: "bookingType",
      label: "Type",
      render: (r) => <TypeBadge type={r.bookingType} />,
    },
    {
      key: "customerName",
      label: "Customer",
      render: (r) => (
        <div>
          <div className="font-semibold text-slate-900">{r.customerName || "—"}</div>
          <div className="text-xs text-slate-400">{r.customerEmail}</div>
        </div>
      ),
    },
    {
      key: "providerName",
      label: "Vehicle / Guide",
      render: (r) => (
        <div className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
          {r.providerName || "—"}
        </div>
      ),
    },
    {
      key: "totalCost",
      label: "Total Cost",
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900">{formatCurrency(r.totalCost)}</span>
        </div>
      ),
    },
    {
      key: "paidAmount",
      label: "Paid / Balance",
      render: (r) => (
        <div>
          <div className="font-semibold text-emerald-600">{formatCurrency(r.paidAmount)}</div>
          <div className="text-xs text-slate-400">
            Bal: {formatCurrency(r.remainingBalance)}
          </div>
        </div>
      ),
    },
    {
      key: "paymentCompletion",
      label: "Completion",
      render: (r) => <CompletionBadge completion={r.paymentCompletion} isOverdue={r.isOverdue} />,
    },
    {
      key: "initialPaymentDate",
      label: "Initial Paid",
      render: (r) => (
        <span className="text-xs text-slate-600">
          {formatDate(r.initialPaymentDate)}
        </span>
      ),
    },
    {
      key: "paymentDueDate",
      label: "Due Date",
      sortable: true,
      render: (r) => (
        <div>
          <span className={`text-xs ${r.isOverdue ? "text-rose-600 font-bold" : "text-slate-600"}`}>
            {formatDate(r.paymentDueDate)}
          </span>
          {r.isOverdue && (
            <div className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5">
              <AlertTriangle size={10} /> Overdue
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (r) => (
        <button
          onClick={() => handleOpenDetail(r)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-orange-500 hover:text-white transition-colors"
        >
          View Details
          <ChevronRight size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Payment Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative financial tracking for 20% advance deposits, 80% final balances, and manual payment reminders.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-orange-500" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile
          icon={<DollarSign className="text-emerald-500" size={18} />}
          label="Revenue Collected"
          value={formatCurrency(summary.totalRevenueCollected)}
          loading={loading}
        />
        <StatTile
          icon={<Clock className="text-amber-500" size={18} />}
          label="20% Deposit Bookings"
          value={summary.partial20Count?.toLocaleString() || "0"}
          loading={loading}
        />
        <StatTile
          icon={<CheckCircle2 className="text-blue-500" size={18} />}
          label="100% Fully Settled"
          value={summary.full100Count?.toLocaleString() || "0"}
          loading={loading}
        />
        <StatTile
          icon={<AlertTriangle className="text-rose-500" size={18} />}
          label="Overdue Balances"
          value={summary.overdueCount?.toLocaleString() || "0"}
          loading={loading}
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-4">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search customer, provider, or ID..."
            />
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Types</option>
              <option value="VEHICLE">Vehicles Only</option>
              <option value="GUIDE">Tour Guides Only</option>
            </select>
          </div>

          {/* Completion Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PARTIAL_20">20% Paid (Deposit)</option>
              <option value="FULL_100">100% Paid (Fully Settled)</option>
              <option value="OVERDUE">⚠️ Overdue 80% Balance</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="lg:col-span-3 flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-1/2 h-11 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-1/2 h-11 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        rows={pageData.content}
        keyField="bookingId"
        loading={loading}
        error={error}
        emptyTitle="No payment records found"
        emptySubtitle="Only confirmed and completed bookings with verified advance payments appear here."
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={pageData.totalPages}
        totalElements={pageData.totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      {/* Slide-over Payment Details Drawer */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedPayment(null)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold text-slate-900">
                      Payment Details: #{selectedPayment.bookingType === "VEHICLE" ? "VBK" : "GBK"}-{selectedPayment.bookingId}
                    </span>
                    <TypeBadge type={selectedPayment.bookingType} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authoritative transaction summary and booking financial breakdown
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {detailLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-3" />
                    <p className="text-sm">Loading complete payment details...</p>
                  </div>
                ) : detailData ? (
                  <>
                    {/* Notification banner if action was triggered */}
                    {notifyMessage && (
                      <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                        notifyMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : notifyMessage.type === "error"
                          ? "bg-rose-50 text-rose-800 border border-rose-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}>
                        {notifyMessage.type === "success" ? (
                          <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={18} />
                        ) : (
                          <AlertTriangle className="shrink-0 text-rose-600 mt-0.5" size={18} />
                        )}
                        <div className="flex-1">{notifyMessage.text}</div>
                      </div>
                    )}

                    {/* Overdue Warning & Action Banner */}
                    {detailData.isOverdue && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                            <AlertTriangle size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-rose-900">
                              80% Final Balance Overdue ({detailData.daysOverdue} days)
                            </h4>
                            <p className="text-xs text-rose-700 mt-0.5">
                              Service completed on {formatDate(detailData.paymentDueDate)}. Outstanding amount: {formatCurrency(detailData.remainingBalance)}.
                            </p>
                            {detailData.lastReminderSentAt && (
                              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                                Last reminder sent: {formatDateTime(detailData.lastReminderSentAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleOpenNotifyModal}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 shadow-xs transition-colors shrink-0"
                        >
                          <Bell size={14} />
                          Notify User
                        </button>
                      </div>
                    )}

                    {/* Pending Balance Reminder Action Banner (Non-overdue with remaining balance) */}
                    {!detailData.isOverdue && detailData.remainingBalance > 0 && detailData.bookingStatus === "CONFIRMED" && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <Clock size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-amber-900">
                              80% Final Balance Pending ({formatCurrency(detailData.remainingBalance)})
                            </h4>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Service due date: {formatDate(detailData.paymentDueDate)}. Advance payment of 20% is confirmed.
                            </p>
                            {detailData.lastReminderSentAt && (
                              <p className="text-[11px] text-amber-700 mt-1 font-medium">
                                Last reminder sent: {formatDateTime(detailData.lastReminderSentAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={handleOpenNotifyModal}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 shadow-xs transition-colors shrink-0"
                        >
                          <Bell size={14} />
                          Send Payment Reminder
                        </button>
                      </div>
                    )}

                    {/* Financial Summary Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          Financial Overview
                        </span>
                        <CompletionBadge completion={detailData.paymentCompletion} isOverdue={detailData.isOverdue} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        <div>
                          <p className="text-[11px] text-slate-400">Total Cost</p>
                          <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(detailData.totalCost)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">20% Advance</p>
                          <p className="text-lg font-bold text-white mt-0.5">{formatCurrency(detailData.advanceAmount)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Total Paid</p>
                          <p className="text-lg font-bold text-emerald-400 mt-0.5">{formatCurrency(detailData.totalPaid)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Remaining Balance</p>
                          <p className={`text-lg font-bold mt-0.5 ${detailData.remainingBalance > 0 ? "text-amber-400" : "text-slate-300"}`}>
                            {formatCurrency(detailData.remainingBalance)}
                          </p>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Settlement Progress</span>
                          <span className="font-semibold text-white">{detailData.paymentCompletion}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              detailData.paymentCompletion === "100%" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: detailData.paymentCompletion === "100%" ? "100%" : "20%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Phases Detail */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                      <h3 className="text-sm font-bold text-slate-900">Payment Breakdown & Gateway Transactions</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 20% Initial Payment */}
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Phase 1: 20% Advance</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              {detailData.initialPayment?.status || "COMPLETED"}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(detailData.advanceAmount)}</p>
                          <div className="text-xs text-slate-500 space-y-1 pt-1">
                            <p>📅 Paid At: <span className="font-medium text-slate-800">{formatDateTime(detailData.initialPayment?.paidAt)}</span></p>
                            <p>🧾 Order ID: <span className="font-mono text-slate-700">{detailData.initialPayment?.payhereOrderId || "—"}</span></p>
                            <p>💳 Gateway ID: <span className="font-mono text-slate-700">{detailData.initialPayment?.payherePaymentId || "—"}</span></p>
                          </div>
                        </div>

                        {/* 80% Final Payment */}
                        <div className={`p-4 rounded-xl border space-y-2 ${
                          detailData.finalPayment?.status === "COMPLETED"
                            ? "border-slate-200 bg-slate-50"
                            : detailData.isOverdue
                            ? "border-rose-300 bg-rose-50/50"
                            : "border-amber-200 bg-amber-50/50"
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Phase 2: 80% Balance</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              detailData.finalPayment?.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700"
                                : detailData.isOverdue
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {detailData.finalPayment?.status === "COMPLETED" ? "COMPLETED" : "PENDING"}
                            </span>
                          </div>
                          <p className="text-lg font-bold text-slate-900">{formatCurrency(detailData.balanceAmount)}</p>
                          <div className="text-xs text-slate-500 space-y-1 pt-1">
                            {detailData.finalPayment?.status === "COMPLETED" ? (
                              <>
                                <p>📅 Paid At: <span className="font-medium text-slate-800">{formatDateTime(detailData.finalPayment?.paidAt)}</span></p>
                                <p>🧾 Order ID: <span className="font-mono text-slate-700">{detailData.finalPayment?.payhereOrderId || "—"}</span></p>
                              </>
                            ) : (
                              <>
                                <p>📅 Due Date: <span className={`font-medium ${detailData.isOverdue ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                                  {formatDate(detailData.paymentDueDate)}
                                </span></p>
                                <p className="text-slate-400">Payable after service completion</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer & Provider Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                          <User size={16} className="text-orange-500" />
                          Customer Information
                        </div>
                        <div className="text-xs space-y-2 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Full Name</span>
                            <span className="font-semibold text-slate-900">{detailData.customerName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Email Address</span>
                            <span className="font-medium text-slate-900">{detailData.customerEmail}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                            <span className="font-medium text-slate-900">{detailData.customerPhone || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                          {detailData.bookingType === "VEHICLE" ? (
                            <Car size={16} className="text-blue-500" />
                          ) : (
                            <UsersIcon size={16} className="text-purple-500" />
                          )}
                          Provider Information
                        </div>
                        <div className="text-xs space-y-2 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">
                              {detailData.bookingType === "VEHICLE" ? "Vehicle" : "Guide"} Name
                            </span>
                            <span className="font-semibold text-slate-900">{detailData.providerName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">District / Location</span>
                            <span className="font-medium text-slate-900">{detailData.providerDistrict || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                            <span className="font-medium text-slate-900">{detailData.providerPhone || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Schedule & Related Trip */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                          <Calendar size={16} className="text-emerald-500" />
                          Service Dates & Itinerary Link
                        </div>
                        <StatusBadge value={detailData.bookingStatus} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Service Period</span>
                          <span className="font-semibold text-slate-900">
                            {formatDate(detailData.startDate)} – {formatDate(detailData.endDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Related Trip</span>
                          {detailData.tripId ? (
                            <span className="font-semibold text-orange-600 flex items-center gap-1">
                              {detailData.tripTitle || `Trip #${detailData.tripId}`}
                            </span>
                          ) : (
                            <span className="text-slate-400">No related trip</span>
                          )}
                        </div>
                      </div>

                      {detailData.pickupLocation && (
                        <div className="text-xs pt-1 border-t border-slate-100 text-slate-600">
                          <span className="text-slate-400 block text-[11px]">Pickup Location</span>
                          <span className="font-medium text-slate-900">{detailData.pickupLocation}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-slate-400">
                    <p>Failed to load payment detail.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Payment Reminder Modal */}
      {notifyModalOpen && detailData && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => !notifyLoading && setNotifyModalOpen(false)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 transition-all space-y-5">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Send Payment Reminder</h3>
                    <p className="text-xs text-slate-500">Dispatch an in-app reminder to the booking owner</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !notifyLoading && setNotifyModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recipient & Financial Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs border border-slate-200/70">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer:</span>
                  <span className="font-semibold text-slate-900">{detailData.customerName} ({detailData.customerEmail})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {detailData.bookingType} #{detailData.bookingId}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Outstanding 80% Balance:</span>
                  <span className="font-bold text-amber-600 text-sm">{formatCurrency(detailData.remainingBalance)}</span>
                </div>
              </div>

              {/* Message Textarea */}
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Notification Message
                    </label>
                    <span className={`text-[11px] font-mono ${
                      customMessage.length > MAX_MESSAGE_LENGTH ? "text-rose-500 font-bold" : "text-slate-400"
                    }`}>
                      {customMessage.length} / {MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    maxLength={MAX_MESSAGE_LENGTH}
                    disabled={notifyLoading}
                    placeholder="Enter custom reminder message for the customer..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This message will be delivered directly into the traveler's notification bell.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setNotifyModalOpen(false)}
                    disabled={notifyLoading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!customMessage.trim() || notifyLoading || customMessage.length > MAX_MESSAGE_LENGTH}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
                  >
                    {notifyLoading ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    ) : (
                      <Send size={13} />
                    )}
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
