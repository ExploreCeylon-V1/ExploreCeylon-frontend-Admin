import { X } from "lucide-react";

// Appears above a DataTable once at least one row is selected. `actions`
// is a list of { label, onClick, tone } — tone controls the button color
// (defaults to a neutral slate button, "red" for destructive actions).
export default function BulkActionBar({ count, onClear, actions }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 mb-4">
      <span className="text-sm font-semibold text-emerald-800">{count} selected</span>
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
              action.tone === "red"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
      <button onClick={onClear} className="ml-auto text-emerald-700 hover:text-emerald-900">
        <X size={16} />
      </button>
    </div>
  );
}
