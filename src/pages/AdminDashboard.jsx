import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import * as adminDashboardService from "../services/adminDashboardService";
import StatTile from "../components/admin/StatTile";
import StatusBadge from "../components/admin/StatusBadge";

const quickActions = [
  { label: "Add Vehicle", href: "/vehicles", color: "bg-emerald-50 text-emerald-900" },
  { label: "Add Guide", href: "/guides", color: "bg-slate-100 text-slate-900" },
  { label: "Add Event", href: "/events", color: "bg-amber-100 text-amber-900" },
  { label: "Moderate Reviews", href: "/reviews", color: "bg-violet-100 text-violet-900" },
];

function timeAgo(value) {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState(null);
  const [topLists, setTopLists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [statsData, activityData, topListsData] = await Promise.all([
          adminDashboardService.getStats(),
          adminDashboardService.getRecentActivity(),
          adminDashboardService.getTopLists(),
        ]);
        setStats(statsData);
        setActivity(activityData);
        setTopLists(topListsData);
      } catch (err) {
        setError(err?.message ?? "Unable to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
      <main className="space-y-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Welcome, {user?.name ? user.name.split(" ")[0] : "Admin"}
            </h1>
          </div>
          <Link to="/analytics" className="inline-flex items-center gap-2 self-start rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition">
            View Analytics →
          </Link>
        </header>

        {error && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        {/* Headline cards */}
        <section className="grid gap-4 xl:grid-cols-4">
          {[
            { title: "Registered Users", value: stats?.totalUsers ?? 0, icon: "👤" },
            { title: "Total Bookings", value: stats?.totalBookings ?? 0, icon: "📅" },
            { title: "Total Revenue", value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: "💰" },
            { title: "Active Trips", value: stats?.activeTrips ?? 0, icon: "📍" },
          ].map((card) => (
            <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">{card.icon}</span>
              <div className="mt-6">
                <p className="text-3xl font-semibold text-slate-950">{loading ? "…" : card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.title}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Dense stat grid — every figure here is a real DB count, no placeholders */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatTile icon="✅" label="Active Users" value={stats?.activeUsers} loading={loading} />
          <StatTile icon="🛡️" label="Verified Users" value={stats?.verifiedUsers} loading={loading} />
          <StatTile icon="🆕" label="New Users (30d)" value={stats?.newUsersLast30Days} loading={loading} />
          <StatTile icon="🧭" label="Trips Created" value={stats?.tripsCreated} loading={loading} />
          <StatTile icon="🏝️" label="Destinations" value={stats?.totalDestinations} loading={loading} />
          <StatTile icon="💎" label="Hidden Gems" value={stats?.totalGems} loading={loading} />
          <StatTile icon="🎉" label="Events" value={stats?.totalEvents} loading={loading} />
          <StatTile icon="🚗" label="Vehicle Bookings" value={stats?.vehicleBookings} loading={loading} />
          <StatTile icon="🧑‍🤝‍🧑" label="Guide Bookings" value={stats?.guideBookings} loading={loading} />
          <StatTile icon="⭐" label="Total Reviews" value={stats?.totalReviews} loading={loading} />
          <StatTile icon="🚩" label="Pending Reviews" value={stats?.pendingReviews} loading={loading} />
          <StatTile icon="⏳" label="Pending Bookings" value={stats?.pendingBookings} loading={loading} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950 mb-4">Recent Activity</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">New Registrations</p>
                <div className="space-y-2">
                  {(activity?.recentRegistrations ?? []).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{r.name}</p>
                        <p className="text-xs text-slate-400 truncate">{r.email}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{timeAgo(r.createdAt)}</span>
                    </div>
                  ))}
                  {!loading && (activity?.recentRegistrations ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">No registrations yet.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">New Trips</p>
                <div className="space-y-2">
                  {(activity?.recentTrips ?? []).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{t.title}</p>
                        <p className="text-xs text-slate-400 truncate">by {t.userName}</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{timeAgo(t.createdAt)}</span>
                    </div>
                  ))}
                  {!loading && (activity?.recentTrips ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">No trips yet.</p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent Bookings</p>
                  <Link to="/bookings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all</Link>
                </div>
                <div className="space-y-2">
                  {(activity?.recentBookings ?? []).map((b) => (
                    <div key={`${b.type}-${b.id}`} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{b.customerName}</p>
                        <p className="text-xs text-slate-400 truncate">{b.providerName}</p>
                      </div>
                      <StatusBadge value={b.status} />
                    </div>
                  ))}
                  {!loading && (activity?.recentBookings ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">No bookings yet.</p>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent Reviews</p>
                  <Link to="/reviews" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">View all</Link>
                </div>
                <div className="space-y-2">
                  {(activity?.recentReviews ?? []).map((r) => (
                    <div key={`${r.entityType}-${r.id}`} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{r.entityName}</p>
                        <p className="text-xs text-slate-400 truncate">{r.reviewerName} · {r.rating}★</p>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{timeAgo(r.createdAt)}</span>
                    </div>
                  ))}
                  {!loading && (activity?.recentReviews ?? []).length === 0 && (
                    <p className="text-sm text-slate-400">No reviews yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition hover:opacity-80 ${action.color}`}>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        {/* Top Lists */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950 mb-4">Most Visited Destinations</h2>
            <div className="space-y-3">
              {(topLists?.topDestinations ?? []).map((d, i) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{i + 1}. {d.name}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{d.reviewCount} reviews · {d.rating?.toFixed(1)}★</span>
                </div>
              ))}
              {!loading && (topLists?.topDestinations ?? []).length === 0 && (
                <p className="text-sm text-slate-400">No data yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950 mb-4">Most Booked Guides</h2>
            <div className="space-y-3">
              {(topLists?.topGuides ?? []).map((g, i) => (
                <div key={g.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{i + 1}. {g.name}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{g.bookingCount} bookings</span>
                </div>
              ))}
              {!loading && (topLists?.topGuides ?? []).length === 0 && (
                <p className="text-sm text-slate-400">No data yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950 mb-4">Most Booked Vehicles</h2>
            <div className="space-y-3">
              {(topLists?.topVehicles ?? []).map((v, i) => (
                <div key={v.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{i + 1}. {v.name}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{v.bookingCount} bookings</span>
                </div>
              ))}
              {!loading && (topLists?.topVehicles ?? []).length === 0 && (
                <p className="text-sm text-slate-400">No data yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
