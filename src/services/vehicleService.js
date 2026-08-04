import {
  adminGet,
  adminPatch,
  adminDelete,
} from "./adminApiClient";

export async function getLocalVehicles() {
  return adminGet("/api/v1/vehicles/local");
}

export async function getVehicleStats() {
  try {
    return await adminGet("/api/v1/admin/stats/vehicles");
  } catch (err) {
    console.error("Failed to load vehicle stats:", err);
    return {
      totalVehicles: 0,
      availableVehicles: 0,
      bookedVehicles: 0,
      totalRevenue: 0,
      totalCommission: 0,
    };
  }
}

export async function updateVehicleStatus(vehicleId, available) {
  return adminPatch(`/api/v1/admin/vehicles/${vehicleId}`, { available });
}

export async function deleteVehicle(vehicleId) {
  return adminDelete(`/api/v1/admin/vehicles/${vehicleId}`);
}