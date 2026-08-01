import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Single router-level gate for every admin page — replaces the
// isAdmin-then-navigate check that used to be copy-pasted into each
// page's own useEffect (Dashboard, Guides, Vehicles had it; Destinations,
// Hidden Gems, Events, Settings, Contact didn't, which was the actual gap:
// a logged-in non-admin traveler could reach those pages). Checking role
// here means no page needs to check it again.
export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
