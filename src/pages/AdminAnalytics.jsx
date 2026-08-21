import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import * as adminAnalyticsService from "../services/adminAnalyticsService";

// Fixed categorical order, validated for CVD separation (see dataviz skill) —
// emerald for the primary series, indigo for the secondary. Never cycled,
// never reassigned by filter state.
const COLOR_PRIMARY = "#059669";
const COLOR_SECONDARY = "#4f46e5";

function ChartCard({ title, children, empty, height = "h-56 sm:h-64" }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-sm sm:text-base font-semibold text-slate-950 mb-3 sm:mb-4">{title}</h2>
      {empty ? (
        <div className={`${height} flex items-center justify-center text-xs sm:text-sm text-slate-400`}>No data yet.</div>
      ) : (
        <div className={height}>{children}</div>
      )}
    </div>
  );
}

function monthLabel(m) {
  if (!m) return "";
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setData(await adminAnalyticsService.getAnalytics());
      } catch (err) {
        setError(err?.message ?? "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 flex items-center justify-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      </div>
    );
  }

  const registrations = (data?.monthlyRegistrations ?? []).map((p) => ({ month: monthLabel(p.month), count: p.count }));
  const trips = (data?.monthlyTrips ?? []).map((p) => ({ month: monthLabel(p.month), count: p.count }));
  const bookings = (data?.monthlyBookings ?? []).map((p) => ({ month: monthLabel(p.month), Vehicle: p.vehicleCount, Guide: p.guideCount }));
  const reviewDist = (data?.reviewDistribution ?? []).map((r) => ({ rating: `${r.rating}★`, count: r.count }));
  const destinationPopularity = (data?.destinationPopularity ?? []).slice(0, 10).map((d) => ({ name: d.name, reviews: d.reviewCount }));

  const hasAnyMonthlyData = registrations.some((r) => r.count > 0) || trips.some((t) => t.count > 0);
  const hasBookingData = bookings.some((b) => b.Vehicle > 0 || b.Guide > 0);
  const hasReviewData = reviewDist.some((r) => r.count > 0);
  const hasDestinationData = destinationPopularity.length > 0;

  return (
    <div className="min-h-screen px-4 py-5 xl:px-10 xl:py-8">
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Last 12 months, computed from live booking/user/review data.</p>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Monthly Registrations" empty={!hasAnyMonthlyData}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrations} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" name="Registrations" stroke={COLOR_PRIMARY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Trips Created" empty={!hasAnyMonthlyData}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trips} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" name="Trips" stroke={COLOR_PRIMARY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Booking Trends (Vehicle vs Guide)" empty={!hasBookingData}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookings} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Vehicle" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Guide" fill={COLOR_SECONDARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Review Rating Distribution" empty={!hasReviewData}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewDist} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="rating" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" name="Reviews" fill={COLOR_PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        <ChartCard title="Destination Popularity (by review count)" empty={!hasDestinationData} height="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={destinationPopularity} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="reviews" name="Reviews" fill={COLOR_PRIMARY} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </main>
    </div>
  );
}
