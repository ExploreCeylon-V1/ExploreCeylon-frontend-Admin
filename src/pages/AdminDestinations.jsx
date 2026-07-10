import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Plus, Edit2, Trash2, Star, X, UploadCloud, Loader2, Download } from "lucide-react";
import { uploadService } from "../services/uploadService";
import DataTable from "../components/admin/DataTable";
import SearchBar from "../components/admin/SearchBar";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import { downloadCsv } from "../utils/csvExport";

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) 
  ? import.meta.env.VITE_API_BASE_URL 
  : "http://localhost:8080";

function getAuthToken() {
  return localStorage.getItem("ec_admin_token") || localStorage.getItem("exploreCeylonToken");
}

function getAuthHeader() {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

const destinationService = {
  // ✅ FIX: includeAll=true add කළා — inactive ඒවත් backend return කරයි
  getAll: async () => {
    const params = new URLSearchParams();
    params.append("includeAll", "true");
    params.append("t", Date.now().toString()); // cache bust

    const response = await fetch(`${API_BASE}/api/v1/destinations?${params.toString()}`, {
      headers: getAuthHeader(),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Failed to fetch destinations`);
    return await response.json();
  },
  create: async (payload) => {
    const response = await fetch(`${API_BASE}/api/v1/destinations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Failed to create destination`);
    return await response.json();
  },
  update: async (id, payload) => {
    const response = await fetch(`${API_BASE}/api/v1/destinations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`Failed to update destination`);
    return await response.json();
  },
  remove: async (id) => {
    const response = await fetch(`${API_BASE}/api/v1/destinations/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to delete destination`);
  },
  toggleFeatured: async (id, featured) => {
    const response = await fetch(`${API_BASE}/api/v1/destinations/${id}/featured?featured=${featured}`, {
      method: "PUT",
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to toggle featured`);
    return await response.json();
  },
  toggleActive: async (id, active) => {
    const response = await fetch(`${API_BASE}/api/v1/destinations/${id}/active?active=${active}`, {
      method: "PUT",
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to toggle active status`);
    return await response.json().catch(() => ({}));
  }
};

const DEFAULT_FORM = {
  name: "", shortDescription: "", description: "", district: "", province: "",
  category: "BEACH", bestMonths: "", activities: "", latitude: "", longitude: "",
  coverImageUrl: "", imageUrls: [], travelTimeFrom: "", entryFee: "", openingHours: "",
  featured: false, active: true, unescoStatus: "", nearbyGems: "",
};

const CATEGORIES = ["ALL", "BEACH", "CULTURAL", "WILDLIFE", "HILL", "SURF", "ADVENTURE", "HERITAGE", "RELIGIOUS", "CITY"];

// ✅ Active filter tabs
const STATUS_TABS = [
  { label: "All",      value: "ALL"      },
  { label: "Active",   value: "ACTIVE"   },
  { label: "Inactive", value: "INACTIVE" },
];

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  // ✅ status tab
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // ✅ NEW: image upload states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await destinationService.getAll();
      setDestinations(data);
    } catch (err) {
      setError("Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Tab counts
  const counts = useMemo(() => ({
    ALL:      destinations.length,
    ACTIVE:   destinations.filter(d => d.active).length,
    INACTIVE: destinations.filter(d => !d.active).length,
  }), [destinations]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((dest) => {
      const matchesSearch =
        (dest.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dest.district || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "ALL" || dest.category === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE"   &&  dest.active) ||
        (statusFilter === "INACTIVE" && !dest.active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [destinations, searchTerm, categoryFilter, statusFilter]);

  // ✅ NEW: Cover image upload handler
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError(null);
      setUploadingCover(true);
      const res = await uploadService.uploadSingle(file, "destinations");
      setFormData((prev) => ({ ...prev, coverImageUrl: res.imageUrl }));
    } catch (err) {
      setError(err?.message || "Cover image upload failed");
    } finally {
      setUploadingCover(false);
      e.target.value = ""; // same file re-select කරන්න පුළුවන් වෙන්න reset කරනවා
    }
  };

  // ✅ NEW: Gallery images upload handler (multiple)
  const handleGalleryImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    try {
      setError(null);
      setUploadingGallery(true);
      const results = await uploadService.uploadMultiple(files, "destinations");
      const newUrls = results.map((r) => r.imageUrl);
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...newUrls] }));
    } catch (err) {
      setError(err?.message || "Gallery images upload failed");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  // ✅ NEW: Remove a gallery image (only from form state, before save)
  const handleRemoveGalleryImage = (urlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== urlToRemove),
    }));
  };

  // ✅ NEW: Remove the cover image
  const handleRemoveCoverImage = () => {
    setFormData((prev) => ({ ...prev, coverImageUrl: "" }));
  };

  const handleAddDestination = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        shortDescription: formData.shortDescription,
        description: formData.description,
        district: formData.district,
        province: formData.province,
        category: formData.category,
        bestMonths: formData.bestMonths,
        activities: formData.activities,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
        coverImageUrl: formData.coverImageUrl,
        imageUrls: formData.imageUrls, // ✅ දැනටමත් array එකක් (upload වුණු URLs)
        travelTimeFrom: formData.travelTimeFrom,
        entryFee: formData.entryFee,
        openingHours: formData.openingHours,
        featured: formData.featured,
        active: formData.active,
        unescoStatus: formData.unescoStatus,
        nearbyGems: formData.nearbyGems,
      };

      if (editingId) {
        await destinationService.update(editingId, payload);
      } else {
        await destinationService.create(payload);
      }

      setShowAddModal(false);
      setEditingId(null);
      setFormData(DEFAULT_FORM);
      loadDestinations();
    } catch (err) {
      setError(err?.message || "Failed to save destination");
    }
  };

  const handleEdit = (destination) => {
    setFormData({
      name: destination.name || "",
      shortDescription: destination.shortDescription || "",
      description: destination.description || "",
      district: destination.district || "",
      province: destination.province || "",
      category: destination.category || "BEACH",
      bestMonths: destination.bestMonths || "",
      activities: destination.activities || "",
      latitude: destination.latitude?.toString() || "",
      longitude: destination.longitude?.toString() || "",
      coverImageUrl: destination.coverImageUrl || "",
      imageUrls: destination.imageUrls || [], // ✅ දැනටමත් array
      travelTimeFrom: destination.travelTimeFrom || "",
      entryFee: destination.entryFee || "",
      openingHours: destination.openingHours || "",
      featured: destination.featured || false,
      active: destination.active ?? true,
      unescoStatus: destination.unescoStatus || "",
      nearbyGems: destination.nearbyGems || "",
    });
    setEditingId(destination.id);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await destinationService.remove(id);
      setDeletingId(null);
      loadDestinations();
    } catch (err) {
      setError("Failed to delete destination");
    }
  };

  const handleToggleFeatured = async (id, currentStatus) => {
    try {
      await destinationService.toggleFeatured(id, !currentStatus);
      loadDestinations();
    } catch (err) {
      setError("Failed to update featured status");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await destinationService.toggleActive(id, !currentStatus);
      loadDestinations();
    } catch (err) {
      setError("Failed to update active status.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <main>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Destinations</h1>
              <p className="text-slate-600 mt-2">Manage tourism destinations and images</p>
            </div>
            <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCsv("destinations.csv", [
                { label: "Name", value: (d) => d.name },
                { label: "District", value: (d) => d.district },
                { label: "Province", value: (d) => d.province },
                { label: "Category", value: (d) => d.category },
                { label: "Active", value: (d) => d.active },
                { label: "Featured", value: (d) => d.featured },
                { label: "Rating", value: (d) => d.rating },
              ], filteredDestinations)}
              className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition text-sm font-medium"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={() => { setEditingId(null); setFormData(DEFAULT_FORM); setShowAddModal(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={20} /> Add Destination
            </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-1 mb-6 border-b border-slate-200">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
                  statusFilter === tab.value
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === tab.value
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}>
                  {counts[tab.value]}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or district..." />
            <div className="relative">
              <select
                value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none pr-10 bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat === "ALL" ? "All Categories" : cat}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between">
              <span>{error}</span><button onClick={() => setError(null)}><X size={18} /></button>
            </div>
          )}

          {/* Table */}
          <DataTable
            loading={loading}
            error={null}
            emptyIcon="🏝️"
            emptyTitle="No destinations found"
            rows={filteredDestinations}
            columns={[
              {
                key: "image", label: "Image",
                render: (dest) => dest.coverImageUrl ? (
                  <img src={dest.coverImageUrl} alt={dest.name} className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">🖼️</div>
                ),
              },
              {
                key: "name", label: "Name",
                render: (dest) => (
                  <div>
                    <p className="font-medium text-slate-900">{dest.name}</p>
                    <p className="text-sm text-slate-500">{dest.category}</p>
                  </div>
                ),
              },
              { key: "district", label: "District", render: (dest) => dest.district },
              {
                key: "status", label: "Status",
                render: (dest) => (
                  <button
                    onClick={() => handleToggleActive(dest.id, dest.active)}
                    title="Click to toggle"
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition ${
                      dest.active
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    }`}
                  >
                    {dest.active ? "Active" : "Inactive"}
                  </button>
                ),
              },
              {
                key: "featured", label: "Featured",
                render: (dest) => (
                  <button
                    onClick={() => handleToggleFeatured(dest.id, dest.featured)}
                    className={`transition p-1 ${dest.featured ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
                  >
                    <Star size={20} fill={dest.featured ? "currentColor" : "none"} />
                  </button>
                ),
              },
              {
                key: "rating", label: "Rating",
                render: (dest) => (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-slate-900 font-medium text-sm">{dest.rating?.toFixed(1) || "-"}</span>
                  </div>
                ),
              },
              {
                key: "actions", label: "Actions",
                render: (dest) => (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(dest)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition" title="Edit"><Edit2 size={18} /></button>
                    <button onClick={() => setDeletingId(dest.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition" title="Delete"><Trash2 size={18} /></button>
                  </div>
                ),
              },
            ]}
          />
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-slate-900">{editingId ? "Edit Destination" : "Add Destination"}</h2>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleAddDestination} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Sigiriya Rock" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">District *</label>
                  <input type="text" required value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Matale" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Province *</label>
                  <input type="text" required value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Central" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
                  <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    {CATEGORIES.filter((cat) => cat !== "ALL").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Short Description *</label>
                <input type="text" required value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Brief description (1-2 sentences)" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Full Description *</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={4} placeholder="Enter detailed destination description" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Latitude *</label>
                  <input type="number" step="any" required value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 7.9570" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Longitude *</label>
                  <input type="number" step="any" required value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 80.7603" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Best Months</label>
                  <input type="text" value={formData.bestMonths} onChange={(e) => setFormData({ ...formData, bestMonths: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Jan-Mar, Jul-Sep" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Activities</label>
                  <input type="text" value={formData.activities} onChange={(e) => setFormData({ ...formData, activities: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Hiking, Photography" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Travel Time From (Base)</label>
                  <input type="text" value={formData.travelTimeFrom} onChange={(e) => setFormData({ ...formData, travelTimeFrom: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 4 hours from Colombo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Entry Fee</label>
                  <input type="text" value={formData.entryFee} onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., $30 USD" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Opening Hours</label>
                  <input type="text" value={formData.openingHours} onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 6:30 AM - 5:30 PM" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">UNESCO Status</label>
                  <input type="text" value={formData.unescoStatus} onChange={(e) => setFormData({ ...formData, unescoStatus: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., World Heritage Site" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nearby Gems</label>
                <input type="text" value={formData.nearbyGems} onChange={(e) => setFormData({ ...formData, nearbyGems: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g., Pidurangala Rock" />
              </div>

              {/* ✅ NEW: Cover Image — file upload (replaces URL text input) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cover Image {!formData.coverImageUrl && "*"}</label>

                {formData.coverImageUrl ? (
                  <div className="flex items-center gap-4">
                    <img src={formData.coverImageUrl} alt="Cover preview" className="h-20 w-20 rounded-lg object-cover border border-slate-200" />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        Replace image
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverImageUpload} className="hidden" />
                      </label>
                      <button type="button" onClick={handleRemoveCoverImage} className="text-sm text-red-600 hover:text-red-700 font-medium text-left">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition ${uploadingCover ? "pointer-events-none opacity-70" : ""}`}>
                    {uploadingCover ? (
                      <>
                        <Loader2 size={24} className="text-emerald-600 animate-spin" />
                        <span className="text-sm text-slate-500">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={24} className="text-slate-400" />
                        <span className="text-sm text-slate-500">Click to upload cover image (JPG, PNG, WEBP — max 5MB)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                      required={!editingId && !formData.coverImageUrl}
                    />
                  </label>
                )}
              </div>

              {/* ✅ NEW: Gallery Images — multi file upload (replaces comma-separated URL textarea) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Images</label>

                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg py-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition ${uploadingGallery ? "pointer-events-none opacity-70" : ""}`}>
                  {uploadingGallery ? (
                    <>
                      <Loader2 size={22} className="text-emerald-600 animate-spin" />
                      <span className="text-sm text-slate-500">Uploading images...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={22} className="text-slate-400" />
                      <span className="text-sm text-slate-500">Click to upload gallery images (multiple allowed)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleGalleryImagesUpload}
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
                          onClick={() => handleRemoveGalleryImage(url)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Mark as Featured</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Active (Visible to public)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingId(null); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium">Cancel</button>
                <button
                  type="submit"
                  disabled={uploadingCover || uploadingGallery}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingId ? "Update Destination" : "Create Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingId}
        title="Delete Destination?"
        message="This action cannot be undone. The destination will be permanently removed."
        confirmLabel="Delete"
        tone="red"
        onCancel={() => setDeletingId(null)}
        onConfirm={() => handleDelete(deletingId)}
      />
    </div>
  );
}