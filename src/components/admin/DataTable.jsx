import { ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import EmptyState from "./EmptyState";

// Generic admin list table — loading/empty/error states, optional column
// sorting, optional row-selection checkboxes (for bulk actions), responsive
// overflow-x scroll. Row rendering stays page-specific via `columns[].render`,
// so each admin page keeps control of its own cells (badges, action buttons,
// links) without this component knowing about any one domain.
export default function DataTable({
  columns,
  rows,
  data,
  keyField = "id",
  loading,
  error,
  emptyIcon,
  emptyTitle = "Nothing found",
  emptySubtitle,
  emptyMessage,
  sortBy,
  sortDir,
  onSort,
  selectable = false,
  selectedIds,
  onToggleRow,
  onToggleAll,
}) {
  const actualRows = rows || data || [];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 flex items-center justify-center shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-10 shadow-sm text-center">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={28} />
        <p className="text-slate-700 font-medium">Something went wrong</p>
        <p className="text-sm text-slate-400 mt-1">{error}</p>
      </div>
    );
  }

  if (!actualRows || actualRows.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <EmptyState icon={emptyIcon} title={emptyTitle} subtitle={emptySubtitle || emptyMessage} />
      </div>
    );
  }

  const allSelected = selectable && actualRows.length > 0 && actualRows.every((r) => selectedIds?.has(r[keyField]));

  return (
    <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {selectable && (
                <th className="px-5 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isStickyAction = col.sticky || col.isActionColumn || col.key === "actions";
                const hideClass = col.className || (col.hideOnMobile ? "hidden sm:table-cell" : (col.hideOnTablet ? "hidden md:table-cell" : ""));
                const stickyClass = isStickyAction ? "sticky right-0 bg-slate-50 z-10 border-l border-slate-200/80" : "";

                return (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => onSort(col.key) : undefined}
                    className={`px-3 sm:px-5 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${hideClass} ${stickyClass} ${
                      col.sortable ? "cursor-pointer select-none hover:text-slate-700" : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortBy === col.key && (
                        sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {actualRows.map((row) => (
              <tr key={row[keyField]} className="group hover:bg-slate-50 transition">
                {selectable && (
                  <td className="px-3 sm:px-5 py-3 sm:py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(row[keyField]) ?? false}
                      onChange={() => onToggleRow(row[keyField])}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const isStickyAction = col.sticky || col.isActionColumn || col.key === "actions";
                  const hideClass = col.className || (col.hideOnMobile ? "hidden sm:table-cell" : (col.hideOnTablet ? "hidden md:table-cell" : ""));
                  const stickyClass = isStickyAction ? "sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-100" : "";

                  return (
                    <td key={col.key} className={`px-3 sm:px-5 py-3 sm:py-4 text-sm text-slate-600 ${hideClass} ${stickyClass}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
