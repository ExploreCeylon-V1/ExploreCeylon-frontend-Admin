import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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
  const navigate = useNavigate();
  const { token, isAdmin } = useAuth();
  
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    bookedVehicles: 0,
    totalRevenue: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");

  const [formData, setFormData] = useState({
    name: "",
    type: "CAR",
    brand: "",
    model: "",
    year: "",
    seats: "",
    color: "",
    latitude: "",
    longitude: "",
    imageUrls: "",
    licensePlate: "",
    pricePerDay: "",
    currency: "USD",
    district: "Colombo",
    pickupLocation: "",
    driverName: "",
    driverPhone: "",
    driverLanguages: "",
    driverIncluded: false,
    airportTransfer: false,
    available: true,
    description: "",
    category: "STANDARD",
  });

  useEffect(() => {
    // Admin කෙනෙක් නෙමෙයි නම් login එකට යවනවා
    if (!isAdmin) {
      navigate("/login");
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch vehicles (public endpoint)
        const vehiclesRes = await fetch(`${API_BASE}/api/v1/vehicles/local`, {
          headers: { "Content-Type": "application/json" },
        });

        if (!vehiclesRes.ok) {
          throw new Error(`Failed to load vehicles: ${vehiclesRes.status}`);
        }

        const vehiclesData = await vehiclesRes.json();
        setVehicles(vehiclesData);

        // Fetch stats (requires auth token)
        if (token) {
          const statsRes = await fetch(`${API_BASE}/api/v1/admin/stats/vehicles`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to load data");
        console.error("Error loading vehicle data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAdmin, navigate, token]);

  const handleAddClick = () => {
    setEditingVehicle(null);
    setFormData({
      name: "", type: "CAR", brand: "", model: "", year: "", seats: "",
      color: "", latitude: "", longitude: "", imageUrls: "", licensePlate: "", pricePerDay: "", currency: "USD",
      district: "Colombo", pickupLocation: "", driverName: "", driverPhone: "",
      driverLanguages: "", driverIncluded: false, airportTransfer: false,
      available: true, description: "", category: "STANDARD",
    });
    setShowModal(true);
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
      imageUrls: vehicle.imageUrls?.join(", ") || "",
      licensePlate: vehicle.licensePlate || "",
      pricePerDay: vehicle.pricePerDay?.toString() || "",
      currency: vehicle.currency || "USD",
      district: vehicle.district || "Colombo",
      pickupLocation: vehicle.pickupLocation || "",
      driverName: vehicle.driverName || "",
      driverPhone: vehicle.driverPhone || "",
      driverLanguages: vehicle.driverLanguages || "",
      driverIncluded: vehicle.driverIncluded || false,
      airportTransfer: vehicle.airportTransfer || false,
      available: vehicle.available !== false,
      description: vehicle.description || "",
      category: vehicle.category || "STANDARD",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!token) {
        alert("Not authenticated. Please log in.");
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
        imageUrls: formData.imageUrls
            ? formData.imageUrls.split(",").map(url => url.trim()).filter(Boolean)
            : [],
        licensePlate: formData.licensePlate,
        pricePerDay: formData.pricePerDay ? parseFloat(formData.pricePerDay) : 0,
        currency: formData.currency,
        district: formData.district,
        pickupLocation: formData.pickupLocation,
        driverName: formData.driverName,
        driverPhone: formData.driverPhone,
        driverLanguages: formData.driverLanguages,
        driverIncluded: formData.driverIncluded,
        airportTransfer: formData.airportTransfer,
        available: formData.available,
        description: formData.description,
        category: formData.category,
      };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editingVehicle ? "update" : "create"} vehicle`);
      }

      alert(`Vehicle ${editingVehicle ? "updated" : "created"} successfully!`);
      setShowModal(false);

      // Reload vehicles
      const vehiclesRes = await fetch(`${API_BASE}/api/v1/vehicles/local`, {
        headers: { "Content-Type": "application/json" },
      });
      if (vehiclesRes.ok) {
        setVehicles(await vehiclesRes.json());
      }
    } catch (err) {
      alert(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (vehicleId, currentStatus) => {
    try {
      if (!token) {
        alert("Not authenticated. Please log in.");
        return;
      }
      
      const response = await fetch(`${API_BASE}/api/v1/admin/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ available: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update vehicle status");
      }

      // Update local state
      setVehicles(vehicles.map((v) =>
        v.id === vehicleId ? { ...v, available: !currentStatus } : v
      ));
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (vehicleId) => {
    try {
      if (!token) {
        alert("Not authenticated. Please log in.");
        return;
      }

      const response = await fetch(`${API_BASE}/api/v1/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete vehicle");
      }

      setVehicles(vehicles.filter((v) => v.id !== vehicleId));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message || "Failed to delete vehicle");
    }
  };

  const totals = [
    { label: "Total Vehicles", value: stats.totalVehicles, icon: "🚗", bgColor: "bg-blue-50" },
    { label: "Available", value: stats.availableVehicles, accent: "text-emerald-600", icon: "✅", bgColor: "bg-emerald-50" },
    { label: "Booked", value: stats.bookedVehicles, accent: "text-rose-600", icon: "📅", bgColor: "bg-rose-50" },
    { label: "Total Revenue", value: `$${Math.round(stats.totalRevenue ?? 0).toLocaleString()}`, accent: "text-amber-600", icon: "💰", bgColor: "bg-amber-50" },
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
          <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">Vehicle Management</h1>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-[320px]">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">🔍</span>
                  <input
                    type="search"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-12 rounded-3xl border border-slate-200 bg-white px-4 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer"
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

          {/* Stats Cards */}
          <section className="grid gap-4 md:grid-cols-4">
            {totals.map((item) => (
              <div key={item.label} className={`rounded-3xl border border-slate-200 ${item.bgColor} p-5 shadow-sm shadow-slate-200/40 transition hover:shadow-md`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                    <p className={`mt-4 text-3xl font-bold ${item.accent ?? "text-slate-950"}`}>
                      {loading ? <span className="animate-pulse">—</span> : item.value}
                    </p>
                  </div>
                  <div className="text-3xl">{item.icon}</div>
                </div>
              </div>
            ))}
          </section>

          {/* Vehicle List */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
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

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              {loading && (
                <div className="flex items-center justify-center p-12">
                  <p className="text-slate-500">Loading vehicles...</p>
                </div>
              )}

              {error && !loading && (
                <div className="bg-rose-50 p-6">
                  <p className="text-rose-800">Error: {error}</p>
                </div>
              )}

              {!loading && !error && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 font-medium text-slate-500">Vehicle</th>
                        <th className="px-6 py-4 font-medium text-slate-500">Type</th>
                        <th className="px-6 py-4 font-medium text-slate-500">District</th>
                        <th className="px-6 py-4 font-medium text-slate-500">Price/Day</th>
                        <th className="px-6 py-4 font-medium text-slate-500">Driver</th>
                        <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                        <th className="px-6 py-4 font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredVehicles.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                            {searchTerm || filterType !== "All Types" ? "No vehicles match your search" : "No vehicles found"}
                          </td>
                        </tr>
                      ) : (
                        filteredVehicles.map((vehicle, index) => (
                          <tr key={vehicle.id} className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">🚗</span>
                                <div>
                                  <p className="font-semibold text-slate-950">{vehicle.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-semibold">{vehicle.type}</td>
                            <td className="px-6 py-4 text-slate-600">{vehicle.district || "-"}</td>
                            <td className="px-6 py-4 text-slate-900 font-semibold">
                              {vehicle.pricePerDay != null ? `${vehicle.currency || "$"}${vehicle.pricePerDay}/day` : "-"}
                            </td>
                            <td className="px-6 py-4 text-slate-600">{vehicle.driverName || "-"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${vehicle.available ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                {vehicle.available ? "Available" : "Unavailable"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
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
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4">
            <p className="text-lg font-semibold text-slate-950">Delete Vehicle?</p>
            <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-2xl border border-slate-200 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-2xl bg-rose-600 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-950">
                {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name *</label>
                  <input
                    type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., Toyota Prius"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                  <select
                    required value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
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
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., Toyota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                  <input
                    type="text" value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., Prius"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input type="text" value={formData.year} 
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })} 
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" 
                    placeholder="e.g., 2020" 
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                    <input
                        type="text" value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder="e.g., Red"
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Seats</label>
                  <input
                    type="number" value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., 4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price Per Day *</label>
                  <input
                    type="number" required step="0.01" value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                  <select
                    required value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
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
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white"
                  >
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                    <input
                      type="number" step="any" value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="e.g., 6.9271"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                    <input
                      type="number" step="any" value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="e.g., 79.8612"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Location</label>
                  <input
                    type="text" value={formData.pickupLocation}
                    onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., Colombo Airport"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text" value={formData.driverName}
                    onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Driver name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Phone</label>
                  <input
                    type="tel" value={formData.driverPhone}
                    onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="+94..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                  <input
                    type="text" value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., ABC-123"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Languages</label>
                  <input
                    type="text" value={formData.driverLanguages}
                    onChange={(e) => setFormData({ ...formData, driverLanguages: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="e.g., English, Sinhala"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="Vehicle details..."
                    rows="3"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Images (Comma separated URLs)
                  </label>
                  <textarea
                    value={formData.imageUrls}
                    onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                    rows="2"
                  />
                  <p className="mt-1 text-xs text-slate-500">Add multiple image URLs separated by commas.</p>
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-6 pt-2">
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
                      type="checkbox" checked={formData.airportTransfer}
                      onChange={(e) => setFormData({ ...formData, airportTransfer: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Airport Transfer</span>
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

              <div className="flex gap-3 pt-6 mt-4 border-t border-slate-200">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={submitting}
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