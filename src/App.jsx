import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./components/AdminLayout";
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminVehicles from "./pages/AdminVehicles";
import AdminSettings from "./pages/AdminSettings";
import AdminEventsPage from "./pages/AdminEvents";
import AdminHiddenGems from "./pages/AdminHiddenGems";
import AdminDestinations from "./pages/AdminDestinations";
import AdminGuides from "./pages/AdminGuides";
import AdminContactPage from "./pages/AdminContactPage";
import AdminLiveChatPage from "./pages/AdminLiveChatPage";
import AdminUsers from "./pages/AdminUsers";
import AdminBookings from "./pages/AdminBookings";
import AdminPayments from "./pages/AdminPayments";
import AdminReviews from "./pages/AdminReviews";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminMaintenance from "./pages/AdminMaintenance";
import SubscribeEmails from "./pages/SubscribeEmails";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes — no layout, no auth */}
          <Route path="/login" element={<AdminLogin />} />

          {/* Every admin page is gated here, once, at the router level —
              individual pages no longer each re-check isAdmin. */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/analytics" element={<AdminAnalytics />} />
              <Route path="/users" element={<AdminUsers />} />
              <Route path="/bookings" element={<AdminBookings />} />
              <Route path="/payments" element={<AdminPayments />} />
              <Route path="/vehicles" element={<AdminVehicles />} />
              <Route path="/settings" element={<AdminSettings />} />
              <Route path="/events" element={<AdminEventsPage />} />
              <Route path="/hidden-gems" element={<AdminHiddenGems />} />
              <Route path="/destinations" element={<AdminDestinations />} />
              <Route path="/guides" element={<AdminGuides />} />
              <Route path="/reviews" element={<AdminReviews />} />
              <Route path="/maintenance" element={<AdminMaintenance />} />
              <Route path="/contact" element={<AdminContactPage />} />
              <Route path="/subscribe-emails" element={<SubscribeEmails />} />
              <Route path="/live-chat" element={<AdminLiveChatPage />} />
            </Route>
          </Route>

          {/* Unknown URL — back to the dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
