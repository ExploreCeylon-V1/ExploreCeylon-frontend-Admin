import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import AdminApprovals from "./AdminApprovals";
import * as adminVerificationService from "../services/adminVerificationService";

vi.mock("../services/adminVerificationService", () => ({
  getVerifications: vi.fn(),
  getImageSignedUrl: vi.fn(),
  approveVerification: vi.fn(),
  rejectVerification: vi.fn(),
}));

const mockPaginatedKycData = {
  content: [
    {
      id: "uuid-001",
      userId: 101,
      userName: "Kasun Fernando",
      userEmail: "kasun@example.com",
      userPhone: "+94771234567",
      nationality: "Sri Lankan",
      documentType: "NATIONAL_ID",
      hasBackImage: true,
      status: "PENDING",
      submittedAt: "2026-08-27T08:30:00",
    },
    {
      id: "uuid-002",
      userId: 102,
      userName: "John Doe",
      userEmail: "john@example.com",
      userPhone: "+12025550143",
      nationality: "American",
      documentType: "PASSPORT",
      hasBackImage: false,
      status: "PENDING",
      submittedAt: "2026-08-27T09:15:00",
    },
    {
      id: "uuid-003",
      userId: 103,
      userName: "Sarah Jenkins",
      userEmail: "sarah@example.com",
      userPhone: "+447911123456",
      nationality: "British",
      documentType: "DRIVING_LICENSE",
      hasBackImage: true,
      status: "PENDING",
      submittedAt: "2026-08-27T10:00:00",
    },
    {
      id: "uuid-004",
      userId: 104,
      userName: "Hans Müller",
      userEmail: "hans@example.de",
      userPhone: "+491512345678",
      nationality: "German",
      documentType: "PASSPORT",
      hasBackImage: false,
      status: "PENDING",
      submittedAt: "2026-08-27T11:45:00",
    },
  ],
  totalElements: 4,
  totalPages: 1,
  page: 0,
  size: 15,
};

describe("AdminApprovals Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 4 pending KYC records returned in paginated content", async () => {
    adminVerificationService.getVerifications.mockResolvedValue(mockPaginatedKycData);

    render(<AdminApprovals />);

    // Wait for the data to load and table to render
    await waitFor(() => {
      expect(screen.getByText("Kasun Fernando")).toBeInTheDocument();
    });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByText("Hans Müller")).toBeInTheDocument();

    // Verify emails
    expect(screen.getByText("kasun@example.com")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("sarah@example.com")).toBeInTheDocument();
    expect(screen.getByText("hans@example.de")).toBeInTheDocument();

    // Verify nationalities
    expect(screen.getByText("Sri Lankan")).toBeInTheDocument();
    expect(screen.getByText("American")).toBeInTheDocument();
    expect(screen.getByText("British")).toBeInTheDocument();
    expect(screen.getByText("German")).toBeInTheDocument();

    // Verify document types
    expect(screen.getByText("NATIONAL ID")).toBeInTheDocument();
    expect(screen.getAllByText("PASSPORT")).toHaveLength(2);
    expect(screen.getByText("DRIVING LICENSE")).toBeInTheDocument();

    // Verify pending badges & review action buttons
    const reviewButtons = screen.getAllByRole("button", { name: /review id/i });
    expect(reviewButtons).toHaveLength(4);

    const pendingBadges = screen.getAllByText("Pending Review");
    expect(pendingBadges).toHaveLength(4);
  });

  it("renders empty state message when content is empty", async () => {
    adminVerificationService.getVerifications.mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 15,
    });

    render(<AdminApprovals />);

    await waitFor(() => {
      expect(screen.getByText("No verification submissions found")).toBeInTheDocument();
    });
  });
});
