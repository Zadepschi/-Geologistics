
import express from "express";
import cors from "cors";

import { pool } from "./db.js";
import { user } from "./data/user.js";

import vehicleRoutes from "./routes/vehicleRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import deliveryRouteRoutes from "./routes/deliveryRouteRoutes.js";

import { updateOrderStatus } from "./services/orderService.js";

const app = express();
const PORT = 3000;
const DELIVERY_CHECK_INTERVAL_MS = 30_000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

/* -------------------------------------------------------------------------- */
/*                                  API Routes                                */
/* -------------------------------------------------------------------------- */

app.use("/api/vehicles", vehicleRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/delivery-routes", deliveryRouteRoutes);

/* -------------------------------------------------------------------------- */
/*                                    Health                                  */
/* -------------------------------------------------------------------------- */

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

/* -------------------------------------------------------------------------- */
/*                                     User                                   */
/* -------------------------------------------------------------------------- */

app.get("/api/user", (_req, res) => {
  res.json(user);
});

/* -------------------------------------------------------------------------- */
/*                      Automatic Delivery Completion                         */
/* -------------------------------------------------------------------------- */

async function completeOverdueOrders(): Promise<void> {
  try {
    const result = await pool.query<{ id: string }>(
      `
      SELECT id
      FROM orders
      WHERE status = 'in-progress'
        AND estimated_arrival_at IS NOT NULL
        AND estimated_arrival_at <= NOW()
        AND delivery_completed_at IS NULL
      ORDER BY estimated_arrival_at ASC
      `
    );

    if (result.rows.length === 0) {
      return;
    }

    console.log(
      `[Auto-completion] Found ${result.rows.length} overdue order(s).`
    );

    for (const row of result.rows) {
      try {
        await updateOrderStatus(row.id, {
          status: "completed",
        });

        console.log(
          `[Auto-completion] Order ${row.id} completed successfully.`
        );
      } catch (error) {
        console.error(
          `[Auto-completion] Failed to complete order ${row.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error(
      "[Auto-completion] Failed to check overdue orders:",
      error
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                    Server                                  */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  // Check overdue orders immediately after startup.
  void completeOverdueOrders();

  // Repeat the check every 30 seconds.
  setInterval(() => {
    void completeOverdueOrders();
  }, DELIVERY_CHECK_INTERVAL_MS);
});
