import { useEffect, useState } from "react";
import { Wrench, AlertTriangle, Save, CheckCircle, AlertCircle, X } from "lucide-react";
import { getMaintenanceStatus, updateMaintenanceStatus } from "../services/adminMaintenanceService";

// ─── Toast Component ──────────────────────────────────────────────────────────
// Same pattern as AdminSettings.jsx — no shared toast context exists yet.
function ToastBanner({ toast, onClose }) {
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
      toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      {toast.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {toast.message}
      <button onClick={onClose} className="ml-2 opacity-80 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminMaintenance() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Tracks the last-saved state, independent of in-progress form edits, so
  // the warning banner reflects what's actually live rather than the draft.
  const [liveActive, setLiveActive] = useState(false);

  const [form, setForm] = useState({ active: false, title: "", description: "" });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getMaintenanceStatus();
        setForm({
          active: !!data?.active,
          title: data?.title ?? "",
          description: data?.description ?? "",
        });
        setLiveActive(!!data?.active);
      } catch {
        showToast("error", "Failed to load maintenance status");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      showToast("error", "Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const saved = await updateMaintenanceStatus(form);
      setLiveActive(!!saved?.active);
      showToast("success", "Maintenance settings saved");
    } catch (err) {
      showToast("error", err?.message || "Failed to save maintenance settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 mb-6">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {toast && <ToastBanner toast={toast} onClose={() => setToast(null)} />}

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance Mode</h1>
          <p className="text-slate-500 text-sm mt-1">
            Take the traveler-facing site offline with a custom message
          </p>
        </div>

        {liveActive && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Maintenance mode is currently ON
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Travelers see the maintenance message instead of the site. Turn it off below when you're done.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Wrench size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900">Site Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Controls whether ExploreCeylon-frontend-web shows the normal site or a maintenance message
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-800">Maintenance Mode</p>
                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                  {form.active ? "Site is offline to travelers" : "Site is live"}
                </p>
              </div>
              <ToggleSwitch
                checked={form.active}
                onChange={(active) => setForm((f) => ({ ...f, active }))}
                label="Toggle maintenance mode"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Title <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="We'll be back soon"
                required
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Description <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="ExploreCeylon is currently undergoing scheduled maintenance. Please check back shortly."
                required
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">
                Shown to travelers on the full-screen maintenance page.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition disabled:opacity-60 shadow-sm"
              >
                <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
