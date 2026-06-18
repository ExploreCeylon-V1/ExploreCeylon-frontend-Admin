import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const summaryCards = [
  { label: "Vehicles", icon: "🚗" },
  { label: "Guides", icon: "🧑‍🤝‍🧑" },
  { label: "Destinations", icon: "📍" },
  { label: "Hidden Gems", icon: "💎" },
];

const bookings = [
  { name: "Kamal Perera", type: "Vehicle", price: "$45", status: "Confirmed" },
  { name: "Sarah Johnson", type: "Guide", price: "$130", status: "Pending" },
  { name: "Liu Wei", type: "Vehicle", price: "$45", status: "Confirmed" },
  { name: "Priya Fernando", type: "Guide", price: "$195", status: "Confirmed" },
  { name: "John Smith", type: "Vehicle", price: "$55", status: "Cancelled" },
];

const quickActions = [
  { label: "Add Vehicle", color: "bg-emerald-50 text-emerald-900" },
  { label: "Add Guide", color: "bg-slate-100 text-slate-900" },
  { label: "Add Event", color: "bg-amber-100 text-amber-900" },
  { label: "Approve Gems", color: "bg-violet-100 text-violet-900", badge: "3" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/login");
      return;
    }
    if (!token) {
      setStatsError("Admin authentication required");
      setLoadingStats(false);
      return;
    }

    async function loadDashboardStats() {
      try {
        setLoadingStats(true);
        setStatsError(null);
        const response = await fetch(`${API_BASE}/api/v1/admin/dashboard`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error(`Dashboard stats request failed: ${response.status}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        setStatsError(error.message || "Unable to load dashboard statistics");
      } finally {
        setLoadingStats(false);
      }
    }
    loadDashboardStats();
  }, [navigate, isAdmin, token]);

  return (
    <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
      <main className="space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Welcome, {user?.name ? user.name.split(' ')[0] : "Admin"}
            </h1>          
          </div>
        </header>

        {statsError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{statsError}</div>
        )}

        {/* Top 4 Cards */}
        <section className="grid gap-4 xl:grid-cols-4">
          {[
            { title: "Registered Users", value: stats?.totalUsers ?? 0, delta: "+12% this month", icon: "👤" },
            { title: "Total Bookings", value: stats?.totalBookings ?? 0, delta: "+8% this month", icon: "📅" },
            { title: "Total Revenue", value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, delta: "+23% this month", icon: "💰" },
            { title: "Active Trips", value: stats?.activeTrips ?? 0, delta: "+5% this month", icon: "📍" },
          ].map((card) => (
            <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">{card.icon}</span>
                <span className="rounded-2xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{card.delta}</span>
              </div>
              <div className="mt-6">
                <p className="text-3xl font-semibold text-slate-950">{loadingStats ? "..." : card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.title}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-3 text-slate-500">
                    <span className="rounded-2xl bg-slate-100 px-3 py-2 text-lg">{card.icon}</span>
                    <span className="text-sm font-medium">{card.label}</span>
                  </div>
                  <p className="mt-5 text-3xl font-semibold text-slate-950">
                    {loadingStats ? "..." : (card.label === "Vehicles" ? stats?.totalVehicles : card.label === "Guides" ? stats?.totalGuides : card.label === "Destinations" ? stats?.totalDestinations : stats?.totalGems) ?? 0}
                  </p>
                </div>
              ))}
            </div>
            {/* Chart Area placeholder kalin thibba widihatama */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 min-h-[300px] flex items-center justify-center text-slate-400 font-semibold">
              Revenue Chart Area
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
              <div className="mt-4 space-y-3">
                {quickActions.map((action) => (
                  <button key={action.label} className={`flex w-full items-center justify-between rounded-3xl px-4 py-4 text-left text-sm font-semibold transition hover:opacity-80 ${action.color}`}>
                    <span>{action.label}</span>
                    {action.badge && <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-slate-900 text-xs text-white">{action.badge}</span>}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>

        {/* Recent Bookings */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-950">Recent Bookings</h2>
            <Link to="/bookings" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View All</Link>
          </div>
          <div className="mt-5 space-y-4">
            {bookings.map((booking) => (
              <div key={booking.name} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                    {booking.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{booking.name}</p>
                    <p className="text-sm text-slate-500">{booking.type}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="font-semibold text-slate-950">{booking.price}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "Confirmed" ? "bg-emerald-100 text-emerald-700" : booking.status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}