import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";
import * as adminDashboardService from "../services/adminDashboardService";

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Admin User", email: "admin@exploreceylon.com", role: "ADMIN" },
    token: "mock-token",
  }),
}));

vi.mock("../services/adminDashboardService", () => ({
  getStats: vi.fn(),
  getRecentActivity: vi.fn(),
  getTopLists: vi.fn(),
}));

const mockDashboardStats = {
  totalUsers: 150,
  totalBookings: 5, // confirmed total bookings (2 vehicle + 3 guide)
  totalRevenue: 200000, // vehicles page (120,000) + tour guides page (80,000)
  activeTrips: 12,
  totalVehicles: 25,
  totalGuides: 18,
  totalDestinations: 45,
  totalGems: 30,
  totalEvents: 14,
  vehicleBookings: 2, // confirmed vehicle bookings
  guideBookings: 3, // confirmed guide bookings
  pendingBookings: 4,
  vehicleRevenue: 120000,
  guideRevenue: 80000,
  totalCommission: 30000,
  activeUsers: 140,
  verifiedUsers: 110,
  newUsersLast30Days: 25,
  tripsCreated: 85,
  totalReviews: 60,
  pendingReviews: 0,
};

const mockActivityData = {
  recentRegistrations: [],
  recentTrips: [],
  recentBookings: [],
  recentReviews: [],
};

const mockTopListsData = {
  topDestinations: [],
  topGuides: [],
  topVehicles: [],
};

describe("AdminDashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Total Revenue ($200,000), confirmed Total Bookings (5), Vehicle Bookings (2), and Guide Bookings (3)", async () => {
    adminDashboardService.getStats.mockResolvedValue(mockDashboardStats);
    adminDashboardService.getRecentActivity.mockResolvedValue(mockActivityData);
    adminDashboardService.getTopLists.mockResolvedValue(mockTopListsData);

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText("Welcome, Admin")).toBeInTheDocument();
    });

    // 1. Verify Total Revenue headline card ($200,000)
    expect(screen.getByText("$200,000")).toBeInTheDocument();
    expect(screen.getByText("Total Revenue")).toBeInTheDocument();

    // 2. Verify Total Bookings headline card (5 confirmed)
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Total Bookings")).toBeInTheDocument();

    // 3. Verify Dense Stat Grid: Vehicle Bookings (2 confirmed) and Guide Bookings (3 confirmed)
    expect(screen.getByText("Vehicle Bookings")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByText("Guide Bookings")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
