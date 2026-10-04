import type { Driver } from "@/entities/driver";

export async function fetchDrivers(): Promise<Driver[]> {
  const res = await fetch("/api/drivers");

  if (!res.ok) {
    throw new Error("Failed to fetch drivers");
  }

  return res.json();
}

export async function createDriver(data: {
  id: string;
  name: string;
  phone: string;
  status: Driver["status"];
  vehicleId?: string | null;
}): Promise<Driver> {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create driver");
  }

  return res.json();
}

export async function updateDriver(
  id: string,
  data: {
    name: string;
    phone: string;
    status: Driver["status"];
    vehicleId?: string | null;
    isArchived?: boolean;
  }
): Promise<Driver> {
  const res = await fetch(`/api/drivers/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update driver");
  }

  return res.json();
}

export async function archiveDriver(
  id: string,
  isArchived = true
): Promise<Driver> {
  const res = await fetch(
    `/api/drivers/${id}/archive`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isArchived,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      isArchived
        ? "Failed to archive driver"
        : "Failed to restore driver"
    );
  }

  return res.json();
}

export async function deleteDriver(
  id: string
): Promise<void> {
  const res = await fetch(
    `/api/drivers/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete driver");
  }
}