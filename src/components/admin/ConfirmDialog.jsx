// Shared confirmation modal — replaces the near-identical delete-confirm
// markup that was copy-pasted across Destinations/Gems/Events/Guides, and
// the native window.confirm/prompt used on Contact Messages/Settings.
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "red",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClasses =
    tone === "red"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        {message && <p className="text-slate-500 text-sm mb-6">{message}</p>}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-medium disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl transition text-sm font-medium disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
