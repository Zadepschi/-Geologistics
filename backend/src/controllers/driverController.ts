import type { Request, Response } from "express";

import {
  getAllDrivers,
  createDriver,
  updateDriver,
  archiveDriver,
} from "../services/driverService.js";

export async function getDrivers(
  _req: Request,
  res: Response
) {
  try {
    const drivers = await getAllDrivers();

    return res.json(drivers);
  } catch (error) {
    console.error("Failed to fetch drivers:", error);

    return res.status(500).json({
      message: "Failed to fetch drivers",
    });
  }
}

export async function createDriverController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const driver = await createDriver(req.body);

    return res.status(201).json(driver);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Failed to create driver:", error);

    return res.status(500).json({
      message: "Failed to create driver",
    });
  }
}

export async function updateDriverController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const driver = await updateDriver(
      req.params.id,
      req.body
    );

    return res.json(driver);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.name === "NotFoundError"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    console.error("Failed to update driver:", error);

    return res.status(500).json({
      message: "Failed to update driver",
    });
  }
}

export async function archiveDriverController(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const isArchived =
      req.body?.isArchived !== false;

    const driver = await archiveDriver(
      req.params.id,
      isArchived
    );

    return res.json(driver);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "NotFoundError"
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    console.error(
      "Failed to archive driver:",
      error
    );

    return res.status(500).json({
      message: "Failed to archive driver",
    });
  }
}