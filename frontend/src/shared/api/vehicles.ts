import type { Vehicle } from "@/entities/vehicle/model/types";

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch("/api/vehicles");

  if (!res.ok) {
    throw new Error("Failed to fetch vehicles");
  }

  return res.json();
}

export async function createVehicle(data: {
  id: string;
  code: string;
  name: string;
  type: Vehicle["type"];
  status: Vehicle["status"];
  telemetry: {
    lat: number | null;
    lng: number | null;
    speedKmH?: number | null;
    heading?: number | null;
    updatedAt?: string | null;
  };
}): Promise<Vehicle> {
  const res = await fetch("/api/vehicles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create vehicle");
  }

  return res.json();
}

export async function updateVehicle(
  id: string,
  data: {
    code: string;
    name: string;
    type: Vehicle["type"];
    status: Vehicle["status"];
    telemetry: {
      lat: number | null;
      lng: number | null;
      speedKmH?: number | null;
      heading?: number | null;
      updatedAt?: string | null;
    };
  }
): Promise<Vehicle> {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update vehicle");
  }

  return res.json();
}

export async function deleteVehicle(id: string): Promise<void> {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete vehicle");
  }
}