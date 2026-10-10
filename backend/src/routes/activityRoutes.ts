import { Router } from "express";
import {
  getRecentActivities,
} from "../controllers/activityController.js";

const router = Router();

router.get("/", getRecentActivities);

export default router;