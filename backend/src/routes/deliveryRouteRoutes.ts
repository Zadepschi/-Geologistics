import { Router } from "express";
import {
  getDeliveryRoutes,
} from "../controllers/orderController.js";

const router = Router();

router.get("/", getDeliveryRoutes);

export default router;