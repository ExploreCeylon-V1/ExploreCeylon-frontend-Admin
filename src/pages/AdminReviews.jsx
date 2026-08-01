import { useEffect, useState, useCallback } from "react";
import { X, Star, MapPin, Gem, Users as UsersIcon, Car, Download } from "lucide-react";
import * as adminReviewService from "../services/adminReviewService";
import DataTable from "../components/admin/DataTable";
import SearchBar from "../components/admin/SearchBar";
import Pagination from "../components/admin/Pagination";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import BulkActionBar from "../components/admin/BulkActionBar";
import { downloadCsv } from "../utils/csvExport";

const PAGE_SIZE = 15;

const ENTITY_META = {
  DESTINATION: { label: "Destination", icon: MapPin, tone: "bg-emerald-100 text-emerald-700" },
  GEM: { label: "Hidden Gem", icon: Gem, tone: "bg-violet-100 text-violet-700" },
  GUIDE: { label: "Guide", icon: UsersIcon, tone: "bg-blue-100 text-blue-700" },
  VEHICLE: { label: "Vehicle", icon: Car, tone: "bg-amber-100 text-amber-700" },
};

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EntityBadge({ type }) {
  const meta = ENTITY_META[type] ?? ENTITY_META.DESTINATION;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.tone}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
}

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} className={i < rating ? "" : "text-slate-300"} />
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const [detailReview, setDetailReview] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set()); // Set of "ENTITYTYPE-id" keys
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminReviewService.getReviews({
        search,
        entityType: entityFilter,
        rating: ratingFilter === "ALL" ? undefined : ratingFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortDir,
        page,
        size: PAGE_SIZE,
      });
      setPageData(data);
    } catch (err) {
      setError(err?.message ?? "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [search, entityFilter, ratingFilter, dateFrom, dateTo, sortBy, sortDir, page]);

  useEffect(() => {
    const timeout = setTimeout(load, 250);
    return () => clearTimeout(timeout);
  }, [load]);

  // Reset pagination/selection when the filters change. Adjusted directly
  // during render (React's recommended pattern for "derived state that
  // resets on prop/state change") instead of in an effect, so it doesn't
  // cost an extra render pass.
  const filterKey = JSON.stringify([search, entityFilter, ratingFilter, dateFrom, dateTo]);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
    setSelectedIds(new Set());
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // AdminReviewResponse.id is only unique per entityType table (a
  // DESTINATION review and a GEM review can share the same numeric id) —
  // key rows by entityType+id for both React's list key and bulk-selection.
  const rows = pageData.content.map((r) => ({ ...r, _key: `${r.entityType}-${r.id}` }));

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

  const confirmBulkDelete = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const items = rows
        .filter((r) => selectedIds.has(r._key))
        .map((r) => ({ entityType: r.entityType, id: r.id }));
      await adminReviewService.bulkDelete(items);
      setPendingBulkDelete(false);
      setSelectedIds(new Set());
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Bulk delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await adminReviewService.getReviews({
        search, entityType: entityFilter,
        rating: ratingFilter === "ALL" ? undefined : ratingFilter,
        dateFrom: dateFrom || undefined, dateTo: dateTo || undefined,
        sortBy, sortDir, page: 0, size: 10000,
      });
      downloadCsv("reviews.csv", [
        { label: "Entity Type", value: (r) => r.entityType },
        { label: "About", value: (r) => r.entityName },
        { label: "Reviewer", value: (r) => r.reviewerName },
        { label: "Rating", value: (r) => r.rating },
        { label: "Comment", value: (r) => r.comment },
        { label: "Posted", value: (r) => r.createdAt },
      ], data.content);
    } catch (err) {
      setActionError(err?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await adminReviewService.deleteReview(pendingDelete.entityType, pendingDelete.id);
      setPendingDelete(null);
      setDetailReview(null);
      await load();
    } catch (err) {
      setActionError(err?.message ?? "Failed to delete review");
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: "entityType", label: "Entity", render: (r) => <EntityBadge type={r.entityType} /> },
    { key: "entityName", label: "About", sortable: true, render: (r) => <span className="font-medium text-slate-900">{r.entityName}</span> },
    { key: "reviewerName", label: "Reviewer", render: (r) => r.reviewerName },
    { key: "rating", label: "Rating", sortable: true, render: (r) => <Stars rating={r.rating} /> },
    { key: "comment", label: "Comment", render: (r) => <span className="line-clamp-1 max-w-xs inline-block">{r.comment || "—"}</span> },
    { key: "createdAt", label: "Date", sortable: true, render: (r) => formatDateTime(r.createdAt) },
    {
      key: "actions", label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setDetailReview(r)} className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 font-medium">View</button>
          <button onClick={() => setPendingDelete(r)} className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
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
              <h1 className="text-3xl font-bold text-slate-900">Review Moderation</h1>
              <p className="text-sm text-slate-500 mt-1">{pageData.totalElements} reviews across destinations, gems, guides & vehicles</p>
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
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name, reviewer, or comment..." />
            <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Entities</option>
              <option value="DESTINATION">Destinations</option>
              <option value="GEM">Hidden Gems</option>
              <option value="GUIDE">Guides</option>
              <option value="VEHICLE">Vehicles</option>
            </select>
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Ratings</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
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
              { label: "Delete Selected", onClick: () => setPendingBulkDelete(true), tone: "red" },
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
            emptyIcon="⭐"
            emptyTitle="No reviews found"
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

      {detailReview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-slate-900">Review</h2>
              <button onClick={() => setDetailReview(null)} className="text-slate-400 hover:text-slate-600 p-1 transition"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex items-center gap-2">
                <EntityBadge type={detailReview.entityType} />
                <Stars rating={detailReview.rating} />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">About</p>
                <p className="font-medium text-slate-900">{detailReview.entityName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">Reviewer</p>
                <p className="text-slate-700">{detailReview.reviewerName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">Comment</p>
                <p className="text-slate-700 whitespace-pre-wrap">{detailReview.comment || "No comment left."}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase mb-1">Posted</p>
                <p className="text-slate-700">{formatDateTime(detailReview.createdAt)}</p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setPendingDelete(detailReview)}
                  className="w-full px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-medium"
                >
                  Delete Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        loading={actionLoading}
        title="Delete this review?"
        message="This will permanently remove the review and recalculate the average rating. This action cannot be undone."
        confirmLabel="Delete"
        tone="red"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmDialog
        open={pendingBulkDelete}
        loading={actionLoading}
        title={`Delete ${selectedIds.size} review${selectedIds.size === 1 ? "" : "s"}?`}
        message="This permanently removes the selected reviews and recalculates each affected entity's average rating. This action cannot be undone."
        confirmLabel="Delete"
        tone="red"
        onCancel={() => setPendingBulkDelete(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}
