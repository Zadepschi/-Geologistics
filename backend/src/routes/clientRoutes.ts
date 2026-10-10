import { Router } from "express";

import {
  getClients,
  createClient,
  updateClient,
  archiveClient,
} from "../controllers/clientController.js";

const router = Router();

router.get("/", getClients);
router.post("/", createClient);
router.patch("/:id", updateClient);
router.patch("/:id/archive", archiveClient);

export default router;