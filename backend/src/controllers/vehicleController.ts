import type { Request, Response } from "express";
import * as vehicleService from "../services/vehicleService.js";

export async function getVehicles(
  _req: Request,
  res: Response
) {
  try {
    const vehicles =
      await vehicleService.getVehicles();

    return res.json(vehicles);
  } catch (error) {
    console.error(
      "Failed to fetch vehicles:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch vehicles",
    });
  }
}

export async function createVehicle(
  req: Request,
  res: Response
) {
  try {
    const vehicle =
      await vehicleService.createVehicle(req.body);

    return res.status(201).json(vehicle);
  } catch (error: any) {
    console.error(
      "Failed to create vehicle:",
      error
    );

    if (error?.code === "23505") {
      if (error?.constraint?.includes("name")) {
        return res.status(409).json({
          message: "Vehicle name already exists.",
        });
      }

      if (error?.constraint?.includes("code")) {
        return res.status(409).json({
          message: "Vehicle code already exists.",
        });
      }

      return res.status(409).json({
        message:
          "Vehicle with these details already exists.",
      });
    }

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create vehicle",
    });
  }
}

export async function updateVehicle(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string;

    const vehicle =
      await vehicleService.updateVehicle(
        id,
        req.body
      );

    return res.json(vehicle);
  } catch (error: any) {
    console.error(
      "Failed to update vehicle:",
      error
    );

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update vehicle",
    });
  }
}

export async function archiveVehicle(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id as string;

    const isArchived =
      req.body?.isArchived !== false;

    const vehicle =
      await vehicleService.archiveVehicle(
        id,
        isArchived
      );

    return res.json(vehicle);
  } catch (error: any) {
    console.error(
      "Failed to archive vehicle:",
      error
    );

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to archive vehicle",
    });
  }
}
