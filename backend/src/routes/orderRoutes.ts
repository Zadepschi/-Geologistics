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
  assignOrderDriver,
} from "../controllers/orderController.js";

const router = Router();

router.get("/", getOrders);

router.get("/delivery-routes", getDeliveryRoutes);

router.get("/delivery-routes/history", getHistoryDeliveryRoutes);

router.post("/", createOrder);

router.patch("/:id", updateOrder);

router.patch("/:id/status", updateOrderStatus);

router.patch("/:id/progress", advanceOrderProgress);

router.patch("/:id/vehicle", assignOrderVehicle);

router.patch("/:id/driver", assignOrderDriver);

export default router;