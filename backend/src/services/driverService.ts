import {
  getDrivers,
  createDriver as createDriverRepository,
  updateDriver as updateDriverRepository,
  archiveDriver as archiveDriverRepository,
} from "../repositories/driverRepository.js";

const DRIVER_STATUSES = [
  "available",
  "on-duty",
  "off-duty",
] as const;

function validateDriverStatus(status: string) {
  if (!DRIVER_STATUSES.includes(status as (typeof DRIVER_STATUSES)[number])) {
    const error = new Error("Invalid driver status");
    error.name = "ValidationError";
    throw error;
  }
}

export async function getAllDrivers() {
  return getDrivers();
}

export async function createDriver(data: {
  id: string;
  name: string;
  phone: string;
  status: string;
  vehicleId?: string | null;
}) {
  if (!data.id || !data.name || !data.phone || !data.status) {
    const error = new Error(
      "id, name, phone and status are required"
    );
    error.name = "ValidationError";
    throw error;
  }

  validateDriverStatus(data.status);

  return createDriverRepository(data);
}

export async function updateDriver(
  id: string,
  data: {
    name: string;
    phone: string;
    status: string;
    vehicleId?: string | null;
    isArchived?: boolean;
  }
) {
  if (!data.name || !data.phone || !data.status) {
    const error = new Error(
      "name, phone and status are required"
    );
    error.name = "ValidationError";
    throw error;
  }

  validateDriverStatus(data.status);

  const driver = await updateDriverRepository(id, data);

  if (!driver) {
    const error = new Error("Driver not found");
    error.name = "NotFoundError";
    throw error;
  }

  return driver;
}

export async function archiveDriver(
  id: string,
  isArchived: boolean
) {
  const driver = await archiveDriverRepository(
    id,
    isArchived
  );

  if (!driver) {
    const error = new Error("Driver not found");
    error.name = "NotFoundError";
    throw error;
  }

  return driver;
}