import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminVehicles from "./pages/AdminVehicles";
import AdminSettings from "./pages/AdminSettings";
import AdminEventsPage from "./pages/AdminEvents";
import AdminHiddenGems from "./pages/AdminHiddenGems";
import AdminDestinations from "./pages/AdminDestinations";
import AdminGuides from "./pages/AdminGuides";

// 🔐 1. ඇඩ්මින් ලොගින් වී ඇත්දැයි බලන පරීක්ෂකය (ProtectedRoute)
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // තවම ලෝඩ් වෙනවා නම් පොඩි ලෝඩින් එකක් පෙන්වන්න
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

  // ලොගින් වෙලා නැත්නම් කෙලින්ම /login පිටුවට රීඩිරෙක්ට් කරන්න
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ලොගින් වෙලා නම් විතරක් ඇතුලේ තියෙන පිටු පෙන්වන්න
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* 🔓 ලේඅවුට් එකක් නැති සාමාන්‍ය පිටු (Public Routes) */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/register" element={<AdminRegister />} />

          {/* 🔐 ලොගින් වූ අයට විතරක් ඇතුල් විය හැකි පිටු (Protected Routes) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/vehicles" element={<AdminVehicles />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/events" element={<AdminEventsPage />} />
              <Route path="/hidden-gems" element={<AdminHiddenGems />} />
              <Route path="/destinations" element={<AdminDestinations />} />
              <Route path="/guides" element={<AdminGuides />} />
            </Route>
          </Route>

          {/* වැරදි URL එකක් ගැහුවොත් කෙලින්ම ඩෑෂ්බෝඩ් එකට හරවා යවන්න */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;