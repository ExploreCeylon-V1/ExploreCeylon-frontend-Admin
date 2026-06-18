import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search, Plus, Edit2, Trash2, Star, X } from "lucide-react";

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
  coverImageUrl: "", imageUrls: "", travelTimeFrom: "", entryFee: "", openingHours: "",
  featured: false, active: true, unescoStatus: "", nearbyGems: "",
};

const CATEGORIES = ["ALL", "BEACH", "CULTURAL", "WILDLIFE", "HILL", "SURF", "ADVENTURE", "HERITAGE", "RELIGIOUS", "CITY"];

// ✅ NEW: Active filter tabs
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
  // ✅ NEW state: status tab
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

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
      // ✅ NEW: status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE"   &&  dest.active) ||
        (statusFilter === "INACTIVE" && !dest.active);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [destinations, searchTerm, categoryFilter, statusFilter]);

  const handleAddDestination = async (e) => {
    e.preventDefault();
    try {
      const imageUrlsArray = formData.imageUrls
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean);

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
        imageUrls: imageUrlsArray,
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
      imageUrls: destination.imageUrls ? destination.imageUrls.join(", ") : "",
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
            <button
              onClick={() => { setEditingId(null); setFormData(DEFAULT_FORM); setShowAddModal(true); }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus size={20} /> Add Destination
            </button>
          </div>

          {/* ✅ NEW: Status Tabs */}
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
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text" placeholder="Search by name or district..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
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
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredDestinations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No destinations found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {["Image", "Name", "District", "Status", "Featured", "Rating", "Actions"].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-slate-900">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredDestinations.map((dest) => (
                      <tr
                        key={dest.id}
                        className={`transition ${
                          !dest.active
                            ? "bg-slate-50 opacity-60"   // inactive rows dimmed
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-6 py-4">
                          {dest.coverImageUrl ? (
                            <img src={dest.coverImageUrl} alt={dest.name} className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">🖼️</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900">{dest.name}</p>
                          <p className="text-sm text-slate-500">{dest.category}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{dest.district}</td>
                        <td className="px-6 py-4">
                          {/* Click කළාම toggle වෙනවා */}
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
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleFeatured(dest.id, dest.featured)}
                            className={`transition p-1 ${dest.featured ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
                          >
                            <Star size={20} fill={dest.featured ? "currentColor" : "none"} />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            <span className="text-slate-900 font-medium text-sm">{dest.rating?.toFixed(1) || "-"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(dest)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition" title="Edit"><Edit2 size={18} /></button>
                            <button onClick={() => setDeletingId(dest.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition" title="Delete"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cover Image URL *</label>
                <input type="url" required value={formData.coverImageUrl} onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="https://example.com/cover.jpg" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gallery Image URLs (comma-separated)</label>
                <textarea value={formData.imageUrls} onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={3} placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" />
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
                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-medium">{editingId ? "Update Destination" : "Create Destination"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-3">Delete Destination?</h3>
            <p className="text-slate-600 text-sm mb-6">This action cannot be undone. The destination will be permanently removed.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition font-medium">Cancel</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}