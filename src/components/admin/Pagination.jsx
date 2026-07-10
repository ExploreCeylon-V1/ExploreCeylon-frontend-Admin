import { ChevronLeft, ChevronRight } from "lucide-react";

// `page` is 0-indexed to match the backend's PageResponse.
export default function Pagination({ page, totalPages, totalElements, size, onPageChange }) {
  if (totalElements === 0) return null;

  const from = page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-sm text-slate-500">
      <span>
        Showing <span className="font-medium text-slate-700">{from}-{to}</span> of{" "}
        <span className="font-medium text-slate-700">{totalElements}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-slate-600 font-medium">
          Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
