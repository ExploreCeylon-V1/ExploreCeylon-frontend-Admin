// Shared confirmation modal — replaces the near-identical delete-confirm
// markup that was copy-pasted across Destinations/Gems/Events/Guides, and
// the native window.confirm/prompt used on Contact Messages/Settings.
//
// requirePassword: for actions that need the ACTING admin to re-confirm their own
// password (role changes, activate/deactivate) — renders a password field and keeps
// Confirm disabled until it's non-empty. Omitted by every other caller, so this is
// purely additive.
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
  requirePassword = false,
  password = "",
  onPasswordChange,
  passwordError,
}) {
  if (!open) return null;

  const confirmClasses =
    tone === "red"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-emerald-600 hover:bg-emerald-700";

  const confirmDisabled = loading || (requirePassword && !password.trim());

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full">
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        {message && <p className="text-slate-500 text-sm mb-6">{message}</p>}
        {requirePassword && (
          <div className="mb-6">
            {/* Decoy fields absorb the browser's saved-credential autofill (which otherwise
                targets the nearest preceding text input on the page — e.g. a search box —
                as "username" and this field as "password"). Off-screen, not display:none,
                so browsers still see them as fillable. */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px", height: 0, overflow: "hidden" }} aria-hidden="true">
              <input type="text" name="fake-username" autoComplete="username" tabIndex="-1" />
              <input type="password" name="fake-password" autoComplete="new-password" tabIndex="-1" />
            </div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Confirm with your admin password
            </label>
            <input
              type="password"
              name="admin-confirm-password"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              autoFocus
              value={password}
              onChange={(e) => onPasswordChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !confirmDisabled) onConfirm();
              }}
              placeholder="Your password"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
            {passwordError && (
              <p className="mt-1.5 text-xs text-red-600">{passwordError}</p>
            )}
          </div>
        )}
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
            disabled={confirmDisabled}
            className={`flex-1 px-4 py-2.5 text-white rounded-xl transition text-sm font-medium disabled:opacity-60 ${confirmClasses}`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
