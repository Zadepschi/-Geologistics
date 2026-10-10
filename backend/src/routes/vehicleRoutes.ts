import { Router } from "express";

import {
  getVehicles,
  createVehicle,
  updateVehicle,
  archiveVehicle,
} from "../controllers/vehicleController.js";

const router = Router();

router.get("/", getVehicles);

router.post("/", createVehicle);

router.patch("/:id", updateVehicle);

router.patch("/:id/archive", archiveVehicle);

export default router;