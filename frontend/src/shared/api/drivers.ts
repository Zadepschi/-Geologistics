import type { Driver } from "@/entities/driver";

export async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch("/api/drivers");

  if (!res.ok) {
    throw new Error("Failed to fetch drivers");
  }

  return res.json();
}