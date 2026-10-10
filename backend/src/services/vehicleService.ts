import * as vehicleRepository from "../repositories/vehicleRepository.js";

const VEHICLE_TYPES = ["truck", "van", "bike"] as const;

const VEHICLE_STATUSES = [
  "idle",
  "assigned",
  "on-route",
  "maintenance",
  "delayed",
] as const;

export function validateVehicleType(type: string) {
  return VEHICLE_TYPES.includes(
    type as (typeof VEHICLE_TYPES)[number]
  );
}

export function validateVehicleStatus(status: string) {
  return VEHICLE_STATUSES.includes(
    status as (typeof VEHICLE_STATUSES)[number]
  );
}

function formatVehicle(vehicle: any) {
  return {
    id: vehicle.id,
    code: vehicle.code,
    name: vehicle.name,
    type: vehicle.type,
    status: vehicle.status,
    isArchived: vehicle.isArchived,
    telemetry: {
      lat: vehicle.lat,
      lng: vehicle.lng,
      speedKmH: vehicle.speedKmH,
      heading: vehicle.heading,
      updatedAt: vehicle.telemetryUpdatedAt,
    },
  };
}

export async function getVehicles() {
  const vehicles =
    await vehicleRepository.findAllVehicles();

  return vehicles.map(formatVehicle);
}

export async function createVehicle(data: {
  id: string;
  code: string;
  name: string;
  type: string;
  status: string;
  telemetry?: {
    lat?: number | null;
    lng?: number | null;
    speedKmH?: number | null;
    heading?: number | null;
    updatedAt?: Date | string | null;
  };
}) {
  if (!data.id || !data.code || !data.name || !data.type || !data.status) {
    const error = new Error(
      "id, code, name, type and status are required"
    );

    (error as any).statusCode = 400;

    throw error;
  }

  if (!validateVehicleType(data.type)) {
    const error = new Error("Invalid vehicle type");

    (error as any).statusCode = 400;

    throw error;
  }

  if (!validateVehicleStatus(data.status)) {
    const error = new Error("Invalid vehicle status");

    (error as any).statusCode = 400;

    throw error;
  }

  const vehicle =
    await vehicleRepository.createVehicle(data);

  return formatVehicle(vehicle);
}

export async function updateVehicle(
  id: string,
  data: {
    code: string;
    name: string;
    type: string;
    status: string;
    telemetry?: {
      lat?: number | null;
      lng?: number | null;
      speedKmH?: number | null;
      heading?: number | null;
      updatedAt?: Date | string | null;
    };
    isArchived?: boolean;
  }
) {
  if (!data.code || !data.name || !data.type || !data.status) {
    const error = new Error(
      "code, name, type and status are required"
    );

    (error as any).statusCode = 400;

    throw error;
  }

  if (!validateVehicleType(data.type)) {
    const error = new Error("Invalid vehicle type");

    (error as any).statusCode = 400;

    throw error;
  }

  if (!validateVehicleStatus(data.status)) {
    const error = new Error("Invalid vehicle status");

    (error as any).statusCode = 400;

    throw error;
  }

  const vehicle =
    await vehicleRepository.updateVehicle(id, data);

  if (!vehicle) {
    const error = new Error("Vehicle not found");

    (error as any).statusCode = 404;

    throw error;
  }

  return formatVehicle(vehicle);
}

export async function archiveVehicle(
  id: string,
  isArchived: boolean
) {
  const vehicle =
    await vehicleRepository.archiveVehicle(
      id,
      isArchived
    );

  if (!vehicle) {
    const error = new Error("Vehicle not found");

    (error as any).statusCode = 404;

    throw error;
  }

  return formatVehicle(vehicle);
}

