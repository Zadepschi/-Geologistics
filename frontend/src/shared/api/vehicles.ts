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
    const errorText = await res.text();

    console.error(
      "Create vehicle API error:",
      res.status,
      errorText
    );

    throw new Error(
      errorText ||
        `Failed to create vehicle (${res.status})`
    );
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
    isArchived?: boolean;
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
    const errorText = await res.text();

    console.error(
      "Update vehicle API error:",
      res.status,
      errorText
    );

    throw new Error(
      errorText ||
        `Failed to update vehicle (${res.status})`
    );
  }

  return res.json();
}

export async function archiveVehicle(
  id: string,
  isArchived = true
): Promise<Vehicle> {
  const res = await fetch(
    `/api/vehicles/${id}/archive`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isArchived }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();

    console.error(
      "Archive vehicle API error:",
      res.status,
      errorText
    );

    throw new Error(
      errorText ||
        (isArchived
          ? "Failed to archive vehicle"
          : "Failed to restore vehicle")
    );
  }

  return res.json();
}

export async function deleteVehicle(
  id: string
): Promise<void> {
  const res = await fetch(
    `/api/vehicles/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    const errorText = await res.text();

    console.error(
      "Delete vehicle API error:",
      res.status,
      errorText
    );

    throw new Error(
      errorText ||
        `Failed to delete vehicle (${res.status})`
    );
  }
}