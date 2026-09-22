import type { Vehicle } from "@/entities/vehicle/model/types";

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");

  if (!res.ok) {
    throw new Error("Failed to fetch vehicles");
  }

  return res.json();
}