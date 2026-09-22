import express from "express";
import { vehicles } from "./data/vehicles.js";
import { clients } from "./data/clients.js";
import { drivers } from "./data/drivers.js";
import { orders, type OrderStatus } from "./data/orders.js";
import { user } from "./data/user.js";
import { notifications } from "./data/notifications.js";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.get("/api/vehicles", (_req, res) => {
  res.json(vehicles);
});

app.get("/api/clients", (_req, res) => {
  res.json(clients);
});

app.get("/api/drivers", (_req, res) => {
  res.json(drivers);
});

app.get("/api/orders", (_req, res) => {
  res.json(orders);
});

app.get("/api/user", (_req, res) => {
  res.json(user);
});

app.get("/api/notifications", (_req, res) => {
  res.json(notifications);
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const id = Number(req.params.id);

  const notification = notifications.find(
    (item) => item.id === id
  );

  if (!notification) {
    return res.status(404).json({
      message: "Notification not found",
    });
  }

  notification.read = true;

  return res.json(notification);
});

app.patch("/api/orders/:id/status", (req, res) => {
  const order = orders.find(
    (item) => item.id === req.params.id
  );

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  const { status } = req.body as {
    status?: OrderStatus;
  };

  if (
    status !== "in-progress" &&
    status !== "completed" &&
    status !== "delayed"
  ) {
    return res.status(400).json({
      message: "Order status is required",
    });
  }

  order.status = status;

  return res.json(order);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});