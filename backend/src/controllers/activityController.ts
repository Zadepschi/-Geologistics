import type { Request, Response } from "express";
import { pool } from "../db.js";
import {
  findRecentActivities,
} from "../repositories/activityRepository.js";

export async function getRecentActivities(
  _req: Request,
  res: Response,
) {
  try {
    const result = await findRecentActivities(
      pool as any,
      20,
    );

    return res.json(result);
  } catch (error) {
    console.error(
      "Failed to fetch recent activities",
      error,
    );

    return res.status(500).json({
      message: "Failed to fetch recent activities",
    });
  }
}