import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Plus, Edit2, Trash2, Check, X, MapPin, Clock, Star, UploadCloud, Loader2, Download } from "lucide-react";
import * as hiddenGemsService from "../services/hiddenGemsService";
import { uploadService } from "../services/uploadService"; // ⚠️ path එක oyaage folder structure එකට ගැලපෙන්න check කරන්න
import DataTable from "../components/admin/DataTable";
import SearchBar from "../components/admin/SearchBar";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import { downloadCsv } from "../utils/csvExport";

const DEFAULT_FORM = {
  title: "", description: "", district: "", category: "ADVENTURE",
  latitude: "", longitude: "", howToGetThere: "", bestTime: "",
  tips: "", imageUrls: [], // ✅ FIX: array (backend field name එකට match)
};

const CATEGORIES = [
  "ADVENTURE",
  "CULTURE_HERITAGE",
  "RELIGIOUS",
  "WILDLIFE_NATURE",
  "BEACH_COAST",
  "HILL_COUNTRY",
  "SCENIC_VIEWS",
  "CITY_URBAN",
];
const ALL_FILTER = "ALL";

// ─── Helper Components ────────────────────────────────────────────────────────

function ApprovalBadge({ approved }) {
  const map = {
    true: "bg-emerald-100 text-emerald-700",
    false: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[String(approved)]}`}>
      {approved ? <><Check size={10} /> Approved</> : <><Clock size={10} /> Pending</>}
    </span>
  );
}

function CategoryBadge({ category }) {
  if(!category) return null;
  const formatted = category.replace(/_/g, " ");
  return (
    <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
      {formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase()}
    </span>
  );
}

function RatingDisplay({ rating }) {
  if (!rating) return <span className="text-slate-400 text-sm">-</span>;
  return (
    <div className="flex items-center gap-1">
      <Star size={14} className="text-amber-400 fill-amber-400" />
      <span className="text-slate-900 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminHiddenGems() {
  const [gems, setGems] = useState([]);
  const [pendingGems, setPendingGems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL_FILTER);
  const [activeTab, setActiveTab] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ✅ NEW: gallery image upload state
  const [uploadingImages, setUploadingImages] = useState(false);

  const loadGems = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allGems, pending] = await Promise.all([
        hiddenGemsService.getAllHiddenGems(),
        hiddenGemsService.getPendingHiddenGems(),
      ]);
      setGems(allGems);
      setPendingGems(pending);
    } catch {
      setError("Failed to load hidden gems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data fetch on mount. loadGems() sets state synchronously
    // (setLoading(true)) before its first await, which the linter can't
    // distinguish from a risky render loop — this is the standard "fetch on
    // mount" effect pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGems();
  }, []);

  const filteredGems = useMemo(() => {
    const source = activeTab === "PENDING" ? pendingGems : gems;
    return source.filter((gem) => {
      const matchesSearch =
        (gem.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gem.district || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === ALL_FILTER || gem.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [gems, pendingGems, searchTerm, categoryFilter, activeTab]);

  // ✅ NEW: multi image upload handler
  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    try {
      setError(null);
      setUploadingImages(true);
      const results = await uploadService.uploadMultiple(files, "gems");
      const newUrls = results.map((r) => r.imageUrl);
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    } catch (err) {
      setError(err?.message || "Image upload failed");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (urlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== urlToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: formData.title, description: formData.description,
        district: formData.district, category: formData.category,
        latitude: parseFloat(formData.latitude) || 0, longitude: parseFloat(formData.longitude) || 0,
        howToGetThere: formData.howToGetThere, bestTime: formData.bestTime,
        tips: formData.tips,
        imageUrls: formData.imageUrls, // ✅ FIX: දැනටමත් array
      };

      if (editingId) {
        await hiddenGemsService.updateHiddenGem(editingId, payload);
      } else {
        await hiddenGemsService.createHiddenGem(payload);
      }

      closeModal();
      await loadGems();
    } catch (err) {
      setError(err?.message || "Failed to save hidden gem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (gem) => {
    setFormData({
      title: gem.title || "", description: gem.description || "",
      district: gem.district || "", category: gem.category || "ADVENTURE",
      latitude: gem.latitude?.toString() || "", longitude: gem.longitude?.toString() || "",
      howToGetThere: gem.howToGetThere || "", bestTime: gem.bestTime || "",
      tips: gem.tips || "", imageUrls: gem.imageUrls || [], // ✅ FIX
    });
    setEditingId(gem.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await hiddenGemsService.deleteHiddenGem(id);
      setDeletingId(null);
      await loadGems();
    } catch (err) {
      setError(err?.message || "Failed to delete hidden gem");
    }
  };

  const handleApprove = async (id) => {
    try {
      await hiddenGemsService.approveHiddenGem(id);
      await loadGems();
    } catch (err) {
      setError(err?.message || "Failed to approve gem");
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData(DEFAULT_FORM);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM);
    setShowAddModal(true);
  };

  const field = (label, key, opts = {}) => {
    const { placeholder = "", required = false, type = "text", rows } = opts;
    const value = formData[key];
    const onChange = (e) => setFormData({ ...formData, [key]: e.target.value });
    const cls = "w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm";

    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        {rows ? (
          <textarea required={required} value={value} onChange={onChange} className={cls} rows={rows} placeholder={placeholder} />
        ) : (
          <input type={type} required={required} value={value} onChange={onChange} className={cls} placeholder={placeholder} />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Hidden Gems</h1>
              <p className="text-slate-600 mt-1">Review user-submitted gems and manage the collection</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadCsv("hidden-gems.csv", [
                  { label: "Title", value: (g) => g.title },
                  { label: "District", value: (g) => g.district },
                  { label: "Category", value: (g) => g.category },
                  { label: "Approved", value: (g) => g.approved },
                  { label: "Rating", value: (g) => g.rating },
                  { label: "Created", value: (g) => g.createdAt },
                ], filteredGems)}
                className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-medium"
              >
                <Download size={16} /> Export CSV
              </button>
              <button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm font-medium">
                <Plus size={18} /> Add New Gem
              </button>
            </div>
          </div>

          {/* ── Search + Filter ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by title, district..." />
            <div className="relative">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-9 bg-white text-sm">
                <option value={ALL_FILTER}>All Categories</option>
                {CATEGORIES.map((c) => {
                  const label = c.replace(/_/g, " ");
                  return <option key={c} value={c}>{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</option>;
                })}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex justify-between">
              <span>{error}</span><button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-1 border-b border-slate-200 w-full mb-4 overflow-x-auto">
            {["ALL", "PENDING"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${activeTab === tab ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                {tab === "ALL" ? `All Gems (${gems.length})` : `Pending Approval (${pendingGems.length})`}
              </button>
            ))}
          </div>

          {/* ── Pending Review Cards ── */}
          {activeTab === "PENDING" && pendingGems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
              <p className="text-sm font-semibold text-amber-800 mb-4">{pendingGems.length} Gem{pendingGems.length > 1 ? "s" : ""} Waiting for Admin Review</p>
              <div className="space-y-3">
                {pendingGems.map((gem) => (
                  <div key={gem.id} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm border border-amber-100 gap-4">
                    <div className="flex items-center gap-3">
                      {gem.imageUrls && gem.imageUrls.length > 0 ? (
                        <img src={gem.imageUrls[0]} alt={gem.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-500 text-lg flex-shrink-0">💎</div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{gem.title}</p>
                        <p className="text-xs text-slate-500">{gem.district} • Created {new Date(gem.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleApprove(gem.id)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition w-full sm:w-auto">
                      <Check size={14} /> Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Main Table ── */}
          <DataTable
            loading={loading}
            emptyIcon="💎"
            emptyTitle="No hidden gems found"
            emptySubtitle="Try adjusting your filters or add a new gem"
            rows={filteredGems}
            columns={[
              {
                key: "image", label: "Image",
                render: (gem) => gem.imageUrls?.length > 0 ? (
                  <img src={gem.imageUrls[0]} alt={gem.title} className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm">🖼️</div>
                ),
              },
              {
                key: "title", label: "Title",
                render: (gem) => (
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{gem.title}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {gem.district}</p>
                  </div>
                ),
              },
              { key: "category", label: "Category", render: (gem) => <CategoryBadge category={gem.category} /> },
              { key: "district", label: "District", hideOnMobile: true, render: (gem) => gem.district },
              { key: "rating", label: "Rating", hideOnMobile: true, render: (gem) => <RatingDisplay rating={gem.rating} /> },
              { key: "approval", label: "Approval Status", render: (gem) => <ApprovalBadge approved={gem.approved} /> },
              { key: "created", label: "Created", hideOnTablet: true, render: (gem) => new Date(gem.createdAt).toLocaleDateString() },
              {
                key: "actions", label: "Actions",
                render: (gem) => (
                  <div className="flex items-center gap-1">
                    {!gem.approved && activeTab === "ALL" && (
                      <button onClick={() => handleApprove(gem.id)} className="text-xs text-emerald-600 hover:text-emerald-800 font-medium px-1.5 transition whitespace-nowrap">✓ Approve</button>
                    )}
                    <button onClick={() => handleEdit(gem)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition" title="Edit"><Edit2 size={15} /></button>
                    <button onClick={() => setDeletingId(gem.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition" title="Delete"><Trash2 size={15} /></button>
                  </div>
                ),
              },
            ]}
          />
        </main>
      </div>

      {/* ── Add/Edit Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between z-10 rounded-t-3xl">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{editingId ? "Edit Hidden Gem" : "Add Hidden Gem"}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {field("Gem Title", "title", { required: true, placeholder: "e.g., Secret Waterfall" })}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("District", "district", { required: true, placeholder: "e.g., Colombo" })}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white">
                    {CATEGORIES.map((c) => {
                      const label = c.replace(/_/g, " ");
                      return <option key={c} value={c}>{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</option>;
                    })}
                  </select>
                </div>
              </div>
              {field("Full Description", "description", { required: true, placeholder: "Detailed description of the gem", rows: 4 })}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("Latitude", "latitude", { required: true, type: "number", placeholder: "e.g., 6.9497" })}
                {field("Longitude", "longitude", { required: true, type: "number", placeholder: "e.g., 80.7891" })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field("Best Time to Visit", "bestTime", { placeholder: "e.g., January – March" })}
                {field("How to Get There", "howToGetThere", { placeholder: "e.g., Boat from Unawatuna (10 min)" })}
              </div>
              {field("Insider Tips", "tips", { placeholder: "e.g., Bring water shoes, go early morning", rows: 2 })}

              {/* ✅ FIX: Gallery Image URLs textarea → real file upload (matches destinations/events) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gallery Images</label>

                <label className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition text-sm ${uploadingImages ? "pointer-events-none opacity-70" : ""}`}>
                  {uploadingImages ? (
                    <>
                      <Loader2 size={20} className="text-emerald-600 animate-spin" />
                      <span className="text-slate-500">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-slate-400" />
                      <span className="text-slate-500 text-center px-4">Click to upload images (multiple allowed — JPG, PNG, WEBP, max 5MB each)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImagesUpload}
                    className="hidden"
                  />
                </label>

                {formData.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {formData.imageUrls.map((url) => (
                      <div key={url} className="relative group">
                        <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 transition"
                          title="Remove"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-10 flex gap-3 pt-4 border-t border-slate-200 bg-white p-4 sm:p-6 mt-auto">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting || uploadingImages} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-60">{submitting ? "Saving…" : editingId ? "Update Gem" : "Create Gem"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Delete Hidden Gem?"
        message="This gem will be removed from the public listing. This action cannot be undone."
        confirmLabel="Delete"
        tone="red"
        onCancel={() => setDeletingId(null)}
        onConfirm={() => handleDelete(deletingId)}
      />
    </div>
  );
}