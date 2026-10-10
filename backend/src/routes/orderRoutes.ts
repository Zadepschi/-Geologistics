import { Router } from "express";

import {
  getOrders,
  createOrder,
  updateOrder,
  updateOrderStatus,
  advanceOrderProgress,
  getDeliveryRoutes,
  getHistoryDeliveryRoutes,
  assignOrderVehicle,
} from "../controllers/orderController.js";

const router = Router();

router.get("/", getOrders);

router.get(
  "/delivery-routes",
  getDeliveryRoutes,
);

router.get(
  "/delivery-routes/history",
  getHistoryDeliveryRoutes,
);

router.post("/", createOrder);

router.patch("/:id", updateOrder);

router.patch("/:id/status", updateOrderStatus);

router.patch("/:id/progress", advanceOrderProgress);

router.patch("/:id/vehicle", assignOrderVehicle);

export default router;