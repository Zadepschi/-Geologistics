import { Router } from "express";

import {
  getDrivers,
  createDriverController,
  updateDriverController,
  archiveDriverController,
} from "../controllers/driverController.js";

const router = Router();

router.get("/", getDrivers);

router.post("/", createDriverController);

router.patch("/:id", updateDriverController);

router.patch(
  "/:id/archive",
  archiveDriverController
);

export default router;