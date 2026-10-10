import express from "express";
import { pool } from "./db.js";
import { user } from "./data/user.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import deliveryRouteRoutes from "./routes/deliveryRouteRoutes.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/delivery-routes", deliveryRouteRoutes);

const PORT = 3000;

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});



/* -------------------------------------------------------------------------- */
/*                                      User                                  */
/* -------------------------------------------------------------------------- */

app.get("/api/user", (_req, res) => {
  res.json(user);
});

/* -------------------------------------------------------------------------- */
/*                                   Server                                   */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});