import { getToken } from "./authService";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function getLocalVehicles() {
  const response = await fetch(`${API_BASE}/api/v1/vehicles/local`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load vehicles: ${response.status}`);
  }

  return response.json();
}

export async function getVehicleStats() {
  const token = getToken();

  const response = await fetch(`${API_BASE}/api/v1/admin/stats/vehicles`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    console.error(`Failed to load vehicle stats: ${response.status}`);
    // Fallback: return default stats when endpoint fails
    return {
      totalVehicles: 0,
      availableVehicles: 0,
      bookedVehicles: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };
  }

  return response.json();
}