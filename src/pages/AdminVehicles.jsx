import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { uploadService } from "../services/uploadService";
import DataTable from "../components/admin/DataTable";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import { UploadCloud, Loader2, X } from "lucide-react";
import {
  getLocalVehicles,
  getVehicleStats,
  updateVehicleStatus,
  deleteVehicle,
} from "../services/vehicleService";
import { adminMutate } from "../services/adminApiClient";

const VEHICLE_TYPES = [
  "CAR", "VAN", "SUV", "TUKTUK", "SCOOTER", "BUS", "MINIVAN",
];
const VEHICLE_CATEGORIES = [
  "ECONOMY", "STANDARD", "PREMIUM", "LUXURY", "LOCAL",
];
const SRI_LANKA_DISTRICTS = [
  "Colombo", "Galle", "Matara", "Hambantota", "Batticaloa", "Ampara",
  "Trincomalee", "Jaffna", "Mullaitivu", "Vavuniya", "Anuradhapura",
  "Matale", "Kandy", "Nuwara Eliya", "Badulla", "Moneragala",
  "Ratnapura", "Kalutara", "Kegalle",
];

export default function AdminVehicles() {
  const { token } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    bookedVehicles: 0,
    totalRevenue: 0,
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "CAR",
    district: "Colombo",
    transmission: "AUTOMATIC",
    seats: 4,
    luggage: 2,
    pricePerDay: 5000,
    imageUrl: "",
    driverName: "",
    driverPhone: "",
    licensePlate: "",
    driverIncluded: true,
    available: true,
    description: "",
    category: "STANDARD",
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const vehiclesData = await getLocalVehicles();
        setVehicles(vehiclesData);

        if (token) {
          const statsData = await getVehicleStats();
          setStats(statsData);
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
        console.error("Error loading vehicle data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => setSuccessMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const handleAddClick = () => {
    setEditingVehicle(null);
    setFormData({
      name: "", type: "CAR", brand: "", model: "", year: "", seats: "",
      color: "", latitude: "", longitude: "", imageUrls: [], licensePlate: "", pricePerDay: "", currency: "USD",
      district: "Colombo", pickupLocation: "", driverName: "", driverPhone: "", whatsappNumber: "",
      driverLanguages: "", driverIncluded: false,
      available: true, description: "", category: "STANDARD",
    });
    setShowModal(true);
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    try {
      setError(null);
      setUploadingImages(true);
      const results = await uploadService.uploadMultiple(files, "vehicles");
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

  const handleEditClick = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      id: vehicle.id,
      name: vehicle.name || "",
      type: vehicle.type || "CAR",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year?.toString() || "",
      seats: vehicle.seats?.toString() || "",
      color: vehicle.color || "",
      latitude: vehicle.latitude?.toString() || "",
      longitude: vehicle.longitude?.toString() || "",
      imageUrls: vehicle.imageUrls || [],
      licensePlate: vehicle.licensePlate || "",
      pricePerDay: vehicle.pricePerDay?.toString() || "",
      currency: vehicle.currency || "USD",
      district: vehicle.district || "Colombo",
      pickupLocation: vehicle.pickupLocation || "",
      driverName: vehicle.driverName || "",
      driverPhone: vehicle.driverPhone || "",
      whatsappNumber: vehicle.whatsappNumber || "",
      driverLanguages: vehicle.driverLanguages || "",
      driverIncluded: vehicle.driverIncluded || false,
      available: vehicle.available !== false,
      description: vehicle.description || "",
      category: vehicle.category || "STANDARD",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!token) {
        setError("Not authenticated. Please log in.");
        return;
      }

      const method = editingVehicle ? "PUT" : "POST";
      const endpoint = editingVehicle
        ? `/api/v1/admin/vehicles/${editingVehicle.id}`
        : "/api/v1/admin/vehicles";

      const body = {
        name: formData.name,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        seats: formData.seats ? parseInt(formData.seats) : null,
        color: formData.color,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        imageUrls: formData.imageUrls,
        licensePlate: formData.licensePlate,
        pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : 0,
        currency: formData.currency,
        district: formData.district,
        pickupLocation: formData.pickupLocation,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        whatsappNumber: formData.whatsappNumber,
        driverLanguages: formData.driverLanguages,
        driverIncluded: formData.driverIncluded,
        available: formData.available,
        description: formData.description,
        category: formData.category,
      };

      await adminMutate(endpoint, method, body);

      setSuccessMessage(`Vehicle ${editingVehicle ? "updated" : "created"} successfully!`);
      setShowModal(false);

      const refreshed = await getLocalVehicles();
      setVehicles(refreshed);
    } catch (err) {
      setError(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (vehicleId, currentStatus) => {
    try {
      await updateVehicleStatus(vehicleId, !currentStatus);
      setVehicles(vehicles.map((v) =>
        v.id === vehicleId ? { ...v, available: !currentStatus } : v
      ));
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "Failed to delete vehicle");
    }
  };

  const totals = [
    { label: "Total Vehicles", value: stats?.totalVehicles ?? 0, icon: "🚗", bgColor: "bg-blue-50" },
    { label: "Available", value: stats?.availableVehicles ?? 0, accent: "text-emerald-600", icon: "✅", bgColor: "bg-emerald-50" },
    { label: "Booked", value: stats?.bookedVehicles ?? 0, accent: "text-rose-600", icon: "📅", bgColor: "bg-rose-50" },
    { label: "Total Revenue", value: `$${Math.round(stats?.totalRevenue ?? 0).toLocaleString()}`, accent: "text-amber-600", icon: "💰", bgColor: "bg-amber-50" },
  ];

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === "" ||
      vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType =
      filterType === "All Types" ||
      vehicle.type?.toUpperCase() === filterType.toUpperCase();
      
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="px-4 py-5 xl:px-10 xl:py-8">
        <main className="space-y-6">
          
          {/* Header */}
          <header className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-950">Vehicle Management</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-0 sm:w-[280px]">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
                  <input
                    type="search"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-2.5 sm:py-3 pl-11 pr-4 text-xs sm:text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-10 sm:h-12 rounded-3xl border border-slate-200 bg-white px-4 text-xs sm:text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer w-full sm:w-auto"
                >
                  <option>All Types</option>
                  <option>TUKTUK</option>
                  <option>VAN</option>
                  <option>SUV</option>
                  <option>CAR</option>
                  <option>SCOOTER</option>
                </select>
              </div>
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={16} /></button>
            </div>
          )}
          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex justify-between items-center">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)}><X size={16} /></button>
            </div>
          )}

          {/* Stats Cards */}
          <section className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            {totals.map((item) => (
              <div key={item.label} className={`rounded-3xl border border-slate-200 ${item.bgColor} p-4 sm:p-5 shadow-sm shadow-slate-200/40 transition hover:shadow-md`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{item.label}</p>
                    <p className={`mt-2 sm:mt-4 text-xl sm:text-3xl font-bold truncate ${item.accent ?? "text-slate-950"}`}>
                      {loading ? <span className="animate-pulse">—</span> : item.value}
                    </p>
                  </div>
                  <div className="text-2xl sm:text-3xl shrink-0">{item.icon}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Vehicle List */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-950">Vehicle list</p>
                <p className="mt-1 text-sm text-slate-500">Manage availability, pricing, and drivers.</p>
              </div>
              <button
                onClick={handleAddClick}
                className="inline-flex h-12 items-center justify-center rounded-3xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                + Add New Vehicle
              </button>
            </div>

            <div className="mt-6">
              <DataTable
                loading={loading}
                emptyIcon="🚗"
                emptyTitle={searchTerm || filterType !== "All Types" ? "No vehicles match your search" : "No vehicles found"}
                rows={filteredVehicles}
                columns={[
                  {
                    key: "name", label: "Vehicle",
                    render: (vehicle) => (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">🚗</span>
                        <p className="font-semibold text-slate-950">{vehicle.name}</p>
                      </div>
                    ),
                  },
                  { key: "type", label: "Type", render: (vehicle) => <span className="font-semibold">{vehicle.type}</span> },
                  { key: "district", label: "District", hideOnMobile: true, render: (vehicle) => vehicle.district || "-" },
                  {
                    key: "price", label: "Price/Day",
                    render: (vehicle) => (
                      <span className="font-semibold text-slate-900">
                        {vehicle.pricePerDay != null ? `${vehicle.currency || "$"}${vehicle.pricePerDay}/day` : "-"}
                      </span>
                    ),
                  },
                  { key: "driver", label: "Driver", hideOnMobile: true, render: (vehicle) => vehicle.driverName || "-" },
                  {
                    key: "status", label: "Status",
                    render: (vehicle) => (
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${vehicle.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {vehicle.available ? "Available" : "Unavailable"}
                      </span>
                    ),
                  },
                  {
                    key: "actions", label: "Actions",
                    render: (vehicle) => (
                      <div className="flex items-center gap-2 text-slate-500">
                        <button
                          onClick={() => handleEditClick(vehicle)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                          title="Edit vehicle"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => handleToggleStatus(vehicle.id, vehicle.available ?? true)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl transition ${vehicle.available ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"}`}
                          title={vehicle.available ? "Mark unavailable" : "Mark available"}
                        >
                          {vehicle.available ? "⏻" : "✓"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(vehicle.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-rose-600 transition hover:bg-rose-100"
                          title="Delete vehicle"
                        >
                          🗑️
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </section>
        </main>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Vehicle?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        tone="red"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
      />

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-950">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name *</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., Toyota Prius"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                  <select
                    required value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-sm"
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                  <input
                    type="text" value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., Toyota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input
                    type="text" value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., Prius"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input type="text" value={formData.year} 
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })} 
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm" 
                    placeholder="e.g., 2020" 
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                    <input
                        type="text" value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                        placeholder="e.g., Red"
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seats</label>
                  <input
                    type="number" value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., 4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price Per Day *</label>
                  <input
                    type="number" required step="0.01" value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                  <select
                    required value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-sm"
                  >
                    {SRI_LANKA_DISTRICTS.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-sm"
                  >
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number" step="any" value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                      placeholder="e.g., 6.9271"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                    <input
                      type="number" step="any" value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                      placeholder="e.g., 79.8612"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Location</label>
                  <input
                    type="text" value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., Colombo Airport"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text" value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="Driver name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="tel" value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="+94..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel" value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="94771234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                  <input
                    type="text" value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., ABC-123"
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Languages</label>
                  <input
                    type="text" value={formData.driverLanguages}
                    onChange={(e) => setFormData({ ...formData, driverLanguages: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="e.g., English, Sinhala"
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                    placeholder="Vehicle details..."
                    rows="3"
                  />
                </div>

                <div className="col-span-full md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Images</label>

                  <label className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-300 py-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition text-sm ${uploadingImages ? "pointer-events-none opacity-70" : ""}`}>
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

                <div className="col-span-full md:col-span-2 flex flex-wrap gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={formData.driverIncluded}
                      onChange={(e) => setFormData({ ...formData, driverIncluded: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Driver Included</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={formData.available}
                      onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Available</span>
                  </label>
                </div>
              </div>
              <div className="sticky bottom-0 z-10 flex gap-3 pt-4 border-t border-slate-200 bg-white p-4 sm:p-6 mt-auto">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting || uploadingImages}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}