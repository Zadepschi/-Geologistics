import express from "express";
import { pool } from "./db.js";
import {
  allowedOrderTransitions,
  type OrderStatus,
} from "./types/orders.js";
import { user } from "./data/user.js";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = 3000;

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

/* -------------------------------------------------------------------------- */
/*                                   Vehicles                                 */
/* -------------------------------------------------------------------------- */
app.get("/api/vehicles", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        code,
        name,
        type,
        status,
        lat,
        lng,
        speed_kmh AS "speedKmH",
        heading,
        telemetry_updated_at AS "telemetryUpdatedAt",
        is_archived AS "isArchived"
      FROM vehicles
      WHERE is_active = TRUE
      ORDER BY id
    `);

    const vehicles = result.rows.map((vehicle) => ({
      id: vehicle.id,
      code: vehicle.code,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      isArchived: vehicle.isArchived,
      telemetry: {
        lat: vehicle.lat,
        lng: vehicle.lng,
        speedKmH: vehicle.speedKmH,
        heading: vehicle.heading,
        updatedAt: vehicle.telemetryUpdatedAt,
      },
    }));

    return res.json(vehicles);
  } catch (error) {
    console.error("Failed to fetch vehicles:", error);

    return res.status(500).json({
      message: "Failed to fetch vehicles",
    });
  }
});

app.post("/api/vehicles", async (req, res) => {
  try {
    const {
      id,
      code,
      name,
      type,
      status,
      telemetry,
    } = req.body;

    if (!id || !code || !name || !type || !status) {
      return res.status(400).json({
        message:
          "id, code, name, type and status are required",
      });
    }

    if (
      type !== "truck" &&
      type !== "van" &&
      type !== "bike"
    ) {
      return res.status(400).json({
        message: "Invalid vehicle type",
      });
    }

    if (
      status !== "on-route" &&
      status !== "idle" &&
      status !== "maintenance" &&
      status !== "delayed"
    ) {
      return res.status(400).json({
        message: "Invalid vehicle status",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO vehicles (
          id,
          code,
          name,
          type,
          status,
          lat,
          lng,
          speed_kmh,
          heading,
          telemetry_updated_at,
          is_archived
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          FALSE
        )
        RETURNING
          id,
          code,
          name,
          type,
          status,
          lat,
          lng,
          speed_kmh AS "speedKmH",
          heading,
          telemetry_updated_at AS "telemetryUpdatedAt",
          is_archived AS "isArchived"
      `,
      [
        id,
        code,
        name,
        type,
        status,
        telemetry?.lat ?? null,
        telemetry?.lng ?? null,
        telemetry?.speedKmH ?? null,
        telemetry?.heading ?? null,
        telemetry?.updatedAt ?? new Date(),
      ]
    );

    const vehicle = result.rows[0];

    return res.status(201).json({
      id: vehicle.id,
      code: vehicle.code,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      isArchived: vehicle.isArchived,
      telemetry: {
        lat: vehicle.lat,
        lng: vehicle.lng,
        speedKmH: vehicle.speedKmH,
        heading: vehicle.heading,
        updatedAt: vehicle.telemetryUpdatedAt,
      },
    });
  } catch (error: any) {
    console.error(
      "Failed to create vehicle:",
      error
    );

    if (error?.code === "23505") {
      if (
        error?.constraint?.includes("name")
      ) {
        return res.status(409).json({
          message:
            "Vehicle name already exists.",
        });
      }

      if (
        error?.constraint?.includes("code")
      ) {
        return res.status(409).json({
          message:
            "Vehicle code already exists.",
        });
      }

      return res.status(409).json({
        message:
          "Vehicle with these details already exists.",
      });
    }

    return res.status(500).json({
      message: "Failed to create vehicle",
    });
  }
});

app.patch("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      code,
      name,
      type,
      status,
      telemetry,
      isArchived,
    } = req.body;

    if (!code || !name || !type || !status) {
      return res.status(400).json({
        message:
          "code, name, type and status are required",
      });
    }

    if (
      type !== "truck" &&
      type !== "van" &&
      type !== "bike"
    ) {
      return res.status(400).json({
        message: "Invalid vehicle type",
      });
    }

    if (
      status !== "on-route" &&
      status !== "idle" &&
      status !== "maintenance" &&
      status !== "delayed"
    ) {
      return res.status(400).json({
        message: "Invalid vehicle status",
      });
    }

    const result = await pool.query(
      `
        UPDATE vehicles
        SET
          code = $1,
          name = $2,
          type = $3,
          status = $4,
          lat = $5,
          lng = $6,
          speed_kmh = $7,
          heading = $8,
          telemetry_updated_at = $9,
          is_archived = COALESCE($10, is_archived)
        WHERE id = $11
        RETURNING
          id,
          code,
          name,
          type,
          status,
          lat,
          lng,
          speed_kmh AS "speedKmH",
          heading,
          telemetry_updated_at AS "telemetryUpdatedAt",
          is_archived AS "isArchived"
      `,
      [
        code,
        name,
        type,
        status,
        telemetry?.lat ?? null,
        telemetry?.lng ?? null,
        telemetry?.speedKmH ?? null,
        telemetry?.heading ?? null,
        telemetry?.updatedAt ?? new Date(),
        typeof isArchived === "boolean"
          ? isArchived
          : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const vehicle = result.rows[0];

    return res.json({
      id: vehicle.id,
      code: vehicle.code,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      isArchived: vehicle.isArchived,
      telemetry: {
        lat: vehicle.lat,
        lng: vehicle.lng,
        speedKmH: vehicle.speedKmH,
        heading: vehicle.heading,
        updatedAt: vehicle.telemetryUpdatedAt,
      },
    });
  } catch (error) {
    console.error("Failed to update vehicle:", error);

    return res.status(500).json({
      message: "Failed to update vehicle",
    });
  }
});

app.patch("/api/vehicles/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;

    const isArchived =
      req.body?.isArchived !== false;

    const result = await pool.query(
      `
        UPDATE vehicles
        SET
          is_archived = $1
        WHERE id = $2
        RETURNING
          id,
          code,
          name,
          type,
          status,
          lat,
          lng,
          speed_kmh AS "speedKmH",
          heading,
          telemetry_updated_at AS "telemetryUpdatedAt",
          is_archived AS "isArchived"
      `,
      [isArchived, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const vehicle = result.rows[0];

    return res.json({
      id: vehicle.id,
      code: vehicle.code,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      isArchived: vehicle.isArchived,
      telemetry: {
        lat: vehicle.lat,
        lng: vehicle.lng,
        speedKmH: vehicle.speedKmH,
        heading: vehicle.heading,
        updatedAt: vehicle.telemetryUpdatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Failed to archive vehicle:",
      error
    );

    return res.status(500).json({
      message: "Failed to archive vehicle",
    });
  }
});

app.delete("/api/vehicles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        UPDATE vehicles
        SET is_active = FALSE
        WHERE id = $1
          AND is_active = TRUE
        RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(
      "Failed to archive vehicle:",
      error
    );

    return res.status(500).json({
      message: "Failed to archive vehicle",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                    Clients                                 */
/* -------------------------------------------------------------------------- */
app.get("/api/clients", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        email,
        address,
        is_archived AS "isArchived"
      FROM clients
      ORDER BY id
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "Failed to fetch clients:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch clients",
    });
  }
});

app.post("/api/clients", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
    } = req.body;

    if (!name || !phone || !email || !address) {
      return res.status(400).json({
        message:
          "name, phone, email and address are required",
      });
    }

    const id = `client-${Date.now()}`;

    const result = await pool.query(
      `
        INSERT INTO clients (
          id,
          name,
          phone,
          email,
          address,
          is_archived
        )
        VALUES ($1, $2, $3, $4, $5, FALSE)
        RETURNING
          id,
          name,
          phone,
          email,
          address,
          is_archived AS "isArchived"
      `,
      [
        id,
        name,
        phone,
        email,
        address,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(
      "Failed to create client:",
      error
    );

    return res.status(500).json({
      message: "Failed to create client",
    });
  }
});

app.patch("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      email,
      address,
      isArchived,
    } = req.body;

    if (!name || !phone || !email || !address) {
      return res.status(400).json({
        message:
          "name, phone, email and address are required",
      });
    }

    const result = await pool.query(
      `
        UPDATE clients
        SET
          name = $1,
          phone = $2,
          email = $3,
          address = $4,
          is_archived = COALESCE($5, is_archived)
        WHERE id = $6
        RETURNING
          id,
          name,
          phone,
          email,
          address,
          is_archived AS "isArchived"
      `,
      [
        name,
        phone,
        email,
        address,
        typeof isArchived === "boolean"
          ? isArchived
          : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(
      "Failed to update client:",
      error
    );

    return res.status(500).json({
      message: "Failed to update client",
    });
  }
});

app.patch(
  "/api/clients/:id/archive",
  async (req, res) => {
    try {
      const { id } = req.params;

      const isArchived =
        req.body?.isArchived !== false;

      const result = await pool.query(
        `
          UPDATE clients
          SET
            is_archived = $1
          WHERE id = $2
          RETURNING
            id,
            name,
            phone,
            email,
            address,
            is_archived AS "isArchived"
        `,
        [isArchived, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Client not found",
        });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "Failed to archive client:",
        error
      );

      return res.status(500).json({
        message: "Failed to archive client",
      });
    }
  }
);

app.delete("/api/clients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        DELETE FROM clients
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error(
      "Failed to delete client:",
      error
    );

    return res.status(409).json({
      message:
        "Client cannot be deleted because it is used by existing orders",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                   Drivers                                  */
/* -------------------------------------------------------------------------- */
app.get("/api/drivers", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        phone,
        status,
        vehicle_id AS "vehicleId",
        is_archived AS "isArchived"
      FROM drivers
      ORDER BY id
    `);



    return res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch drivers:", error);

    return res.status(500).json({
      message: "Failed to fetch drivers",
    });
  }
});

app.post("/api/drivers", async (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      status,
      vehicleId,
    } = req.body;

    if (!id || !name || !phone || !status) {
      return res.status(400).json({
        message:
          "id, name, phone and status are required",
      });
    }

    if (
      status !== "available" &&
      status !== "on-duty" &&
      status !== "off-duty"
    ) {
      return res.status(400).json({
        message: "Invalid driver status",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO drivers (
          id,
          name,
          phone,
          status,
          vehicle_id,
          is_archived
        )
        VALUES ($1, $2, $3, $4, $5, FALSE)
        RETURNING
          id,
          name,
          phone,
          status,
          vehicle_id AS "vehicleId",
          is_archived AS "isArchived"
      `,
      [
        id,
        name,
        phone,
        status,
        vehicleId || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create driver:", error);

    return res.status(500).json({
      message: "Failed to create driver",
    });
  }
});

app.patch("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    


    const {
      name,
      phone,
      status,
      vehicleId,
      isArchived,
    } = req.body;

    if (!name || !phone || !status) {
      return res.status(400).json({
        message:
          "name, phone and status are required",
      });
    }

    if (
      status !== "available" &&
      status !== "on-duty" &&
      status !== "off-duty"
    ) {
      return res.status(400).json({
        message: "Invalid driver status",
      });
    }

    const result = await pool.query(
      `
        UPDATE drivers
        SET
          name = $1,
          phone = $2,
          status = $3,
          vehicle_id = $4,
          is_archived = COALESCE($5, is_archived)
        WHERE id = $6
        RETURNING
          id,
          name,
          phone,
          status,
          vehicle_id AS "vehicleId",
          is_archived AS "isArchived"
      `,
      [
        name,
        phone,
        status,
        vehicleId || null,
        typeof isArchived === "boolean"
          ? isArchived
          : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update driver:", error);

    return res.status(500).json({
      message: "Failed to update driver",
    });
  }
});

app.patch(
  "/api/drivers/:id/archive",
  async (req, res) => {
    try {
      const { id } = req.params;

      const isArchived =
        req.body?.isArchived !== false;

      const result = await pool.query(
        `
          UPDATE drivers
          SET
            is_archived = $1
          WHERE id = $2
          RETURNING
            id,
            name,
            phone,
            status,
            vehicle_id AS "vehicleId",
            is_archived AS "isArchived"
        `,
        [isArchived, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Driver not found",
        });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "Failed to archive driver:",
        error
      );

      return res.status(500).json({
        message: "Failed to archive driver",
      });
    }
  }
);

app.delete("/api/drivers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
        DELETE FROM drivers
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete driver:", error);

    return res.status(409).json({
      message:
        "Driver cannot be deleted because it is used by existing orders",
    });
  }
});

/* -------------------------------------------------------------------------- */
/*                                    Orders                                  */
/* -------------------------------------------------------------------------- */

app.get("/api/orders", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.client_id AS "clientId",
        o.status,
        da.address,
        o.eta,
        o.vehicle_id AS "vehicleId",
        o.driver_id AS "driverId"
      FROM orders o
      JOIN delivery_addresses da
        ON da.id = o.delivery_address_id
      ORDER BY o.id
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch orders:", error);

    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});



app.post("/api/orders", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      clientId,
      address,
      latitude,
      longitude,
      vehicleId,
      driverId,
      eta,
    } = req.body;

    if (
      !clientId ||
      !address ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !vehicleId ||
      !driverId ||
      !eta
    ) {
      return res.status(400).json({
        message:
          "clientId, address, latitude, longitude, vehicleId, driverId and eta are required",
      });
    }

    await client.query("BEGIN");

    // Проверяем клиента
    const clientResult = await client.query(
      `
        SELECT id
        FROM clients
        WHERE id = $1
      `,
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Блокируем машину на время создания заказа.
    // Это не позволяет одновременно назначить
    // одну машину на два заказа.
    const vehicleResult = await client.query(
      `
        SELECT
          id,
          status
        FROM vehicles
        WHERE id = $1
        FOR UPDATE
      `,
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    if (vehicleResult.rows[0].status !== "idle") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Vehicle is not available",
      });
    }


     // Проверяем, нет ли у машины другого активного заказа.
const activeVehicleOrderResult = await client.query(
  `
    SELECT
      id,
      status
    FROM orders
    WHERE vehicle_id = $1
      AND status IN (
        'assigned',
        'in-progress',
        'delayed'
      )
    LIMIT 1
  `,
  [vehicleId]
);

if (activeVehicleOrderResult.rows.length > 0) {
  await client.query("ROLLBACK");

  return res.status(409).json({
    message: "Vehicle is already assigned to an active order",
  });
}


    // Блокируем водителя на время создания заказа.
    // Это не позволяет одновременно назначить
    // одного водителя на два заказа.
    const driverResult = await client.query(
      `
        SELECT
          id,
          status,
          vehicle_id AS "vehicleId"
        FROM drivers
        WHERE id = $1
        FOR UPDATE
      `,
      [driverId]
    );

    if (driverResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const driver = driverResult.rows[0];

    if (driver.status !== "available") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Driver is not available",
      });
    }

    // Если за водителем уже закреплена другая машина,
    // не разрешаем назначить ему выбранную машину.
    if (
      driver.vehicleId &&
      driver.vehicleId !== vehicleId
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Selected driver is assigned to another vehicle",
      });
    }

    // Проверяем, нет ли у водителя другого активного заказа.
    const activeOrderResult = await client.query(
      `
        SELECT
          id,
          status
        FROM orders
        WHERE driver_id = $1
          AND status IN (
            'assigned',
            'in-progress',
            'delayed'
          )
        LIMIT 1
      `,
      [driverId]
    );

    if (activeOrderResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Driver is already assigned to an active order",
      });
    }

    // Создаём адрес доставки
    const addressResult = await client.query(
      `
        INSERT INTO delivery_addresses (
          address,
          latitude,
          longitude
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          address,
          latitude,
          longitude
      `,
      [
        address,
        latitude,
        longitude,
      ]
    );

    const deliveryAddress = addressResult.rows[0];

    // Создаём заказ
    const orderId = `ORD-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

    const orderResult = await client.query(
      `
        INSERT INTO orders (
          id,
          client_id,
          delivery_address_id,
          driver_id,
          vehicle_id,
          status,
          eta
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING
          id,
          client_id AS "clientId",
          delivery_address_id AS "deliveryAddressId",
          driver_id AS "driverId",
          vehicle_id AS "vehicleId",
          status,
          eta
      `,
      [
        orderId,
        clientId,
        deliveryAddress.id,
        driverId,
        vehicleId,
        "assigned",
        eta,
      ]
    );

    const order = orderResult.rows[0];
// Заказ создан в статусе "assigned".
// Машина пока остаётся свободной ("idle").
// В "on-route" она перейдёт только после Start delivery.

// Водитель уже закреплён за заказом,
// поэтому переводим его в рабочее состояние.
await client.query(
  `
    UPDATE drivers
    SET
      status = 'on-duty'
    WHERE id = $1
  `,
  [driverId]
);
    // Только после успешного создания заказа
    // и резервирования машины/водителя фиксируем транзакцию.
    await client.query("COMMIT");

    return res.status(201).json({
      id: order.id,
      clientId: order.clientId,
      status: order.status,
      address: deliveryAddress.address,
      eta: order.eta,
      vehicleId: order.vehicleId,
      driverId: order.driverId,
      deliveryAddress: {
        id: deliveryAddress.id,
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Failed to create order:",
      error
    );

    return res.status(500).json({
      message: "Failed to create order",
    });
  } finally {
    client.release();
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
        SELECT
          id,
          status,
          delivery_address_id AS "deliveryAddressId"
        FROM orders
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Order cannot be deleted in its current status",
      });
    }

    await client.query(
      `
        DELETE FROM orders
        WHERE id = $1
      `,
      [req.params.id]
    );

    await client.query(
      `
        DELETE FROM delivery_addresses
        WHERE id = $1
          AND NOT EXISTS (
            SELECT 1
            FROM orders
            WHERE delivery_address_id = $1
          )
      `,
      [order.deliveryAddressId]
    );

    await client.query("COMMIT");

    return res.status(204).send();
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Failed to delete order:",
      error
    );

    return res.status(500).json({
      message: "Failed to delete order",
    });
  } finally {
    client.release();
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      clientId,
      address,
      latitude,
      longitude,
      eta,
    } = req.body as {
      clientId?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      eta?: string;
    };

    if (
      !clientId ||
      !address ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !eta
    ) {
      return res.status(400).json({
        message:
          "clientId, address, latitude, longitude and eta are required",
      });
    }

    await client.query("BEGIN");

    const orderResult = await client.query(
      `
        SELECT
          id,
          status,
          delivery_address_id AS "deliveryAddressId",
          vehicle_id AS "vehicleId"
        FROM orders
        WHERE id = $1
      `,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Order cannot be edited in its current status",
      });
    }

    const clientResult = await client.query(
      `
        SELECT id
        FROM clients
        WHERE id = $1
      `,
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Client not found",
      });
    }

    await client.query(
      `
        UPDATE delivery_addresses
        SET
          address = $1,
          latitude = $2,
          longitude = $3
        WHERE id = $4
      `,
      [
        address,
        latitude,
        longitude,
        order.deliveryAddressId,
      ]
    );

    const updatedOrderResult = await client.query(
      `
        UPDATE orders
        SET
          client_id = $1,
          eta = $2
        WHERE id = $3
        RETURNING
          id,
          client_id AS "clientId",
          delivery_address_id AS "deliveryAddressId",
          vehicle_id AS "vehicleId",
          status,
          eta
      `,
      [
        clientId,
        eta,
        req.params.id,
      ]
    );

    const updatedOrder =
      updatedOrderResult.rows[0];

    await client.query("COMMIT");

    return res.json({
      id: updatedOrder.id,
      clientId: updatedOrder.clientId,
      status: updatedOrder.status,
      address,
      eta: updatedOrder.eta,
      vehicleId: updatedOrder.vehicleId,
      deliveryAddress: {
        id: updatedOrder.deliveryAddressId,
        latitude,
        longitude,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Failed to update order:",
      error
    );

    return res.status(500).json({
      message: "Failed to update order",
    });
  } finally {
    client.release();
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  const client = await pool.connect();

  try {
    const { status, route } = req.body as {
      status?: OrderStatus;
      route?: {
        start?: [number, number];
        finish?: [number, number];
        path?: [number, number][];
      };
    };

    // -----------------------------------------------------------------------
    // 1. Проверяем допустимый статус
    // -----------------------------------------------------------------------

    if (
      status !== "in-progress" &&
      status !== "completed" &&
      status !== "delayed"
    ) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    await client.query("BEGIN");

    // -----------------------------------------------------------------------
    // 2. Получаем заказ и блокируем его строку.
    // Это защищает от параллельного изменения одного заказа.
    // -----------------------------------------------------------------------

    const orderResult = await client.query(
      `
        SELECT
          id,
          client_id AS "clientId",
          delivery_address_id AS "deliveryAddressId",
          driver_id AS "driverId",
          vehicle_id AS "vehicleId",
          status,
          eta
        FROM orders
        WHERE id = $1
        FOR UPDATE
      `,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    // -----------------------------------------------------------------------
    // 3. Проверяем допустимость перехода статуса
    // -----------------------------------------------------------------------

    const currentStatus = order.status as OrderStatus;

    const allowedTransitions =
      allowedOrderTransitions[currentStatus];

    if (!allowedTransitions.includes(status)) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          `Cannot change order status from "${currentStatus}" to "${status}"`,
        currentStatus,
        requestedStatus: status,
        allowedTransitions,
      });
    }

    // -----------------------------------------------------------------------
    // 4. START DELIVERY
    // -----------------------------------------------------------------------

    if (status === "in-progress") {
      // ---------------------------------------------------------------------
      // 4.1 Проверяем маршрут
      // ---------------------------------------------------------------------

      if (
        !route?.start ||
        !route?.finish ||
        !route?.path ||
        route.path.length < 2
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Route is required to start delivery",
        });
      }

      // ---------------------------------------------------------------------
      // 4.2 Проверяем активный маршрут
      // ---------------------------------------------------------------------

      const activeRouteResult = await client.query(
        `
          SELECT id
          FROM delivery_routes
          WHERE order_id = $1
            AND completed_at IS NULL
          LIMIT 1
        `,
        [order.id]
      );

      if (activeRouteResult.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "Order already has an active delivery route",
        });
      }

      // ---------------------------------------------------------------------
      // 4.3 Создаём маршрут.
      //
      // ВАЖНО:
      // current_path_index = 0
      // completed_path = первая точка
      // last_progress_at = NOW()
      //
      // С этого момента прогресс принадлежит PostgreSQL.
      // ---------------------------------------------------------------------

      await client.query(
        `
          INSERT INTO delivery_routes (
            order_id,
            vehicle_id,
            driver_id,
            start_lat,
            start_lng,
            finish_lat,
            finish_lng,
            path,
            current_path_index,
            completed_path,
            last_progress_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            0,
            $9::jsonb,
            NOW()
          )
        `,
        [
          order.id,
          order.vehicleId,
          order.driverId,

          // В БД храним latitude / longitude отдельно.
          route.start[1],
          route.start[0],

          route.finish[1],
          route.finish[0],

          JSON.stringify(route.path),

          // Первая точка маршрута уже считается пройденной
          // начальной точкой.
          JSON.stringify([route.path[0]]),
        ]
      );

      // ---------------------------------------------------------------------
      // 4.4 Переводим машину на маршрут
      // ---------------------------------------------------------------------

      const vehicleResult = await client.query(
        `
          UPDATE vehicles
          SET
            status = 'on-route',
            lat = $1,
            lng = $2,
            speed_kmh = 0,
            telemetry_updated_at = NOW()
          WHERE id = $3
            AND status = 'idle'
          RETURNING id
        `,
        [
          route.start[1],
          route.start[0],
          order.vehicleId,
        ]
      );

      if (vehicleResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          message: "Vehicle is no longer available",
        });
      }
    }

    // -----------------------------------------------------------------------
    // 5. Меняем статус заказа
    // -----------------------------------------------------------------------

    await client.query(
      `
        UPDATE orders
        SET status = $1
        WHERE id = $2
      `,
      [status, order.id]
    );

    // -----------------------------------------------------------------------
    // 6. Если доставка завершена вручную —
    // закрываем маршрут и освобождаем ресурсы.
    // -----------------------------------------------------------------------

    if (status === "completed") {
      // Закрываем активный маршрут.
      await client.query(
        `
          UPDATE delivery_routes
          SET
            completed_at = NOW(),
            last_progress_at = NOW()
          WHERE order_id = $1
            AND completed_at IS NULL
        `,
        [order.id]
      );

      // Освобождаем машину.
      await client.query(
        `
          UPDATE vehicles
          SET
            status = 'idle',
            speed_kmh = 0,
            telemetry_updated_at = NOW()
          WHERE id = $1
        `,
        [order.vehicleId]
      );

      // Освобождаем водителя.
      await client.query(
        `
          UPDATE drivers
          SET
            status = 'available'
          WHERE id = $1
        `,
        [order.driverId]
      );
    }

    // -----------------------------------------------------------------------
    // 7. Получаем адрес доставки
    // -----------------------------------------------------------------------

    const addressResult = await client.query(
      `
        SELECT
          address,
          latitude,
          longitude
        FROM delivery_addresses
        WHERE id = $1
      `,
      [order.deliveryAddressId]
    );

    const deliveryAddress = addressResult.rows[0];

    // -----------------------------------------------------------------------
    // 8. Получаем актуальное состояние маршрута
    // -----------------------------------------------------------------------

    const routeResult = await client.query(
      `
        SELECT
          id,
          order_id AS "orderId",
          vehicle_id AS "vehicleId",
          driver_id AS "driverId",

          start_lat AS "startLat",
          start_lng AS "startLng",

          finish_lat AS "finishLat",
          finish_lng AS "finishLng",

          path,
          current_path_index AS "currentPathIndex",
          completed_path AS "completedPath",

          started_at AS "startedAt",
          last_progress_at AS "lastProgressAt",
          completed_at AS "completedAt"

        FROM delivery_routes
        WHERE order_id = $1
        ORDER BY id DESC
        LIMIT 1
      `,
      [order.id]
    );

    const deliveryRoute = routeResult.rows[0] ?? null;

    // -----------------------------------------------------------------------
    // 9. Фиксируем транзакцию
    // -----------------------------------------------------------------------

    await client.query("COMMIT");

    // -----------------------------------------------------------------------
    // 10. Возвращаем обновлённый заказ вместе с маршрутом
    // -----------------------------------------------------------------------

    return res.json({
      id: order.id,
      clientId: order.clientId,
      status,
      address: deliveryAddress?.address ?? "—",
      eta: order.eta ?? "—",
      vehicleId: order.vehicleId,
      driverId: order.driverId,

      deliveryAddress: {
        id: order.deliveryAddressId,
        latitude: deliveryAddress?.latitude ?? null,
        longitude: deliveryAddress?.longitude ?? null,
      },

      deliveryRoute: deliveryRoute
        ? {
            id: deliveryRoute.id,
            orderId: deliveryRoute.orderId,
            vehicleId: deliveryRoute.vehicleId,
            driverId: deliveryRoute.driverId,

            start: [
              deliveryRoute.startLng,
              deliveryRoute.startLat,
            ],

            finish: [
              deliveryRoute.finishLng,
              deliveryRoute.finishLat,
            ],

            path: deliveryRoute.path,

            currentPathIndex:
              deliveryRoute.currentPathIndex,

            completedPath:
              deliveryRoute.completedPath,

            startedAt:
              deliveryRoute.startedAt,

            lastProgressAt:
              deliveryRoute.lastProgressAt,

            completedAt:
              deliveryRoute.completedAt,
          }
        : null,
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Игнорируем ошибку rollback.
    }

    console.error(
      "Failed to update order status:",
      error
    );

    return res.status(500).json({
      message: "Failed to update order status",
    });
  } finally {
    client.release();
  }
});


app.patch("/api/orders/:id/progress", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ------------------------------------------------------------
    // 1. Блокируем заказ.
    //
    // Это защищает от двух вкладок браузера,
    // одновременно двигающих один и тот же маршрут.
    // ------------------------------------------------------------

    const orderResult = await client.query(
      `
        SELECT
          id,
          status,
          vehicle_id AS "vehicleId",
          driver_id AS "driverId"
        FROM orders
        WHERE id = $1
        FOR UPDATE
      `,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    // ------------------------------------------------------------
    // 2. Получаем последний маршрут и блокируем его.
    //
    // В отличие от старой версии здесь НЕ фильтруем
    // completed_at IS NULL.
    //
    // Это позволяет корректно вернуть состояние уже
    // завершённого маршрута при повторном запросе.
    // ------------------------------------------------------------

    const routeResult = await client.query(
      `
        SELECT
          id,
          order_id AS "orderId",
          vehicle_id AS "vehicleId",
          driver_id AS "driverId",

          start_lat AS "startLat",
          start_lng AS "startLng",

          finish_lat AS "finishLat",
          finish_lng AS "finishLng",

          path,
          current_path_index AS "currentPathIndex",
          started_at AS "startedAt",
          last_progress_at AS "lastProgressAt",
          completed_at AS "completedAt"

        FROM delivery_routes
        WHERE order_id = $1
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
      `,
      [order.id]
    );

    // ------------------------------------------------------------
    // 3. Если маршрута нет.
    // ------------------------------------------------------------

    if (routeResult.rows.length === 0) {
      await client.query("ROLLBACK");

      if (order.status === "completed") {
        return res.json({
          status: "completed",
          completed: true,
          route: null,
        });
      }

      return res.status(409).json({
        message: "Delivery route not found",
      });
    }

    const route = routeResult.rows[0];

    // ------------------------------------------------------------
    // ВАЖНО:
    //
    // Backend хранит полный path в PostgreSQL,
    // но НЕ отправляет его обратно на каждый progress request.
    //
    // Frontend уже имеет path из deliveryRoute.
    // ------------------------------------------------------------

    const createProgressRoute = () => ({
      id: route.id,

      orderId: route.orderId,

      vehicleId: route.vehicleId,

      driverId: route.driverId,

      currentPathIndex:
        Number(route.currentPathIndex) || 0,

      startedAt:
        route.startedAt,

      lastProgressAt:
        route.lastProgressAt,

      completedAt:
        route.completedAt,
    });

    // ------------------------------------------------------------
    // 4. Если заказ уже завершён — ничего не двигаем.
    //
    // Это также делает endpoint идемпотентным.
    // ------------------------------------------------------------

    if (
      order.status === "completed" ||
      route.completedAt
    ) {
      await client.query("COMMIT");

      return res.json({
        status: "completed",
        completed: true,
        route:
          createProgressRoute(),
      });
    }

    // ------------------------------------------------------------
    // 5. Двигать можно только активную доставку.
    // ------------------------------------------------------------

    if (
      order.status !== "in-progress"
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          `Order is not in-progress: ${order.status}`,
      });
    }

    // ------------------------------------------------------------
    // 6. Получаем path только внутри backend.
    //
    // Он нужен для расчёта следующего индекса,
    // но больше никогда не отправляется клиенту
    // через этот endpoint.
    // ------------------------------------------------------------

    const path =
      route.path as [number, number][];

    if (
      !Array.isArray(path) ||
      path.length === 0
    ) {
      await client.query("ROLLBACK");

      return res.status(500).json({
        message:
          "Delivery route has an empty path",
      });
    }

    // ------------------------------------------------------------
    // 7. Считаем, сколько времени прошло.
    //
    // Один шаг = 700 мс.
    //
    // Благодаря этому после sleep/wake backend
    // догоняет маршрут от сохранённого состояния.
    // ------------------------------------------------------------

    const STEP_INTERVAL_MS = 700;

    const lastProgressAt =
      new Date(
        route.lastProgressAt
      ).getTime();

    const now = Date.now();

    const elapsedMs = Math.max(
      0,
      now - lastProgressAt
    );

    const elapsedSteps =
      Math.floor(
        elapsedMs /
          STEP_INTERVAL_MS
      );

    // ------------------------------------------------------------
    // Если ещё не прошло 700 мс,
    // просто возвращаем компактное текущее состояние.
    // ------------------------------------------------------------

    if (elapsedSteps <= 0) {
      await client.query("COMMIT");

      return res.json({
        status: "in-progress",
        completed: false,
        route:
          createProgressRoute(),
      });
    }

    // ------------------------------------------------------------
    // 8. Backend сам вычисляет новую точку.
    //
    // Клиент НЕ передаёт currentPathIndex.
    // ------------------------------------------------------------

    const currentPathIndex =
      Number(
        route.currentPathIndex
      ) || 0;

    const nextPathIndex =
      Math.min(
        currentPathIndex +
          elapsedSteps,
        path.length - 1
      );

    const consumedSteps =
      nextPathIndex -
      currentPathIndex;

    const isCompleted =
      nextPathIndex >=
      path.length - 1;

    const nextPoint =
      path[nextPathIndex];

    // ------------------------------------------------------------
    // 9. Не теряем остаток времени.
    //
    // Например:
    // прошло 1500 мс
    // использовали 2 шага = 1400 мс
    // 100 мс остаются до следующего шага.
    // ------------------------------------------------------------

    const nextProgressAt =
      new Date(
        lastProgressAt +
          consumedSteps *
            STEP_INTERVAL_MS
      );

    // ------------------------------------------------------------
    // 10. Обновляем маршрут.
    //
    // completed_path продолжает храниться в PostgreSQL,
    // потому что это источник истины.
    //
    // Но completed_path НЕ отправляется клиенту
    // через этот endpoint.
    // ------------------------------------------------------------

    const completedPath =
      path.slice(
        0,
        nextPathIndex + 1
      );

    if (isCompleted) {
      await client.query(
        `
          UPDATE delivery_routes
          SET
            current_path_index = $1,
            completed_path = $2::jsonb,
            last_progress_at = $3,
            completed_at = NOW()
          WHERE id = $4
        `,
        [
          nextPathIndex,

          JSON.stringify(
            completedPath
          ),

          nextProgressAt,

          route.id,
        ]
      );

      // ----------------------------------------------------------
      // 11. Завершаем заказ.
      // ----------------------------------------------------------

      await client.query(
        `
          UPDATE orders
          SET status = 'completed'
          WHERE id = $1
        `,
        [order.id]
      );

      // ----------------------------------------------------------
      // 12. Освобождаем машину.
      // ----------------------------------------------------------

      await client.query(
        `
          UPDATE vehicles
          SET
            status = 'idle',
            lat = $1,
            lng = $2,
            speed_kmh = 0,
            telemetry_updated_at = NOW()
          WHERE id = $3
        `,
        [
          nextPoint[1],
          nextPoint[0],
          order.vehicleId,
        ]
      );

      // ----------------------------------------------------------
      // 13. Освобождаем водителя.
      // ----------------------------------------------------------

      await client.query(
        `
          UPDATE drivers
          SET status = 'available'
          WHERE id = $1
        `,
        [order.driverId]
      );
    } else {
      // ----------------------------------------------------------
      // Обычное движение.
      // ----------------------------------------------------------

      await client.query(
        `
          UPDATE delivery_routes
          SET
            current_path_index = $1,
            completed_path = $2::jsonb,
            last_progress_at = $3
          WHERE id = $4
        `,
        [
          nextPathIndex,

          JSON.stringify(
            completedPath
          ),

          nextProgressAt,

          route.id,
        ]
      );

      // ----------------------------------------------------------
      // Обновляем телеметрию машины.
      // ----------------------------------------------------------

      await client.query(
        `
          UPDATE vehicles
          SET
            lat = $1,
            lng = $2,
            status = 'on-route',
            telemetry_updated_at = NOW()
          WHERE id = $3
        `,
        [
          nextPoint[1],
          nextPoint[0],
          order.vehicleId,
        ]
      );
    }

    // ------------------------------------------------------------
    // 14. Получаем только актуальное состояние ПРОГРЕССА.
    //
    // ВАЖНО:
    // Здесь специально НЕТ:
    //   path
    //   completedPath
    //   start
    //   finish
    //
    // Они уже есть у frontend.
    // ------------------------------------------------------------

    const updatedRouteResult =
      await client.query(
        `
          SELECT
            id,
            order_id AS "orderId",
            vehicle_id AS "vehicleId",
            driver_id AS "driverId",

            current_path_index AS "currentPathIndex",

            started_at AS "startedAt",
            last_progress_at AS "lastProgressAt",
            completed_at AS "completedAt"

          FROM delivery_routes
          WHERE id = $1
        `,
        [route.id]
      );

    const updatedRoute =
      updatedRouteResult.rows[0];

    await client.query("COMMIT");

    return res.json({
      status:
        isCompleted
          ? "completed"
          : "in-progress",

      completed:
        isCompleted,

      route:
        updatedRoute,
    });
  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // ignore rollback error
    }

    console.error(
      "Failed to advance delivery progress:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to advance delivery progress",
    });
  } finally {
    client.release();
  }
});

app.get("/api/delivery-routes", async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          order_id AS "orderId",
          vehicle_id AS "vehicleId",
          driver_id AS "driverId",

          start_lat AS "startLat",
          start_lng AS "startLng",

          finish_lat AS "finishLat",
          finish_lng AS "finishLng",

          path,
          current_path_index AS "currentPathIndex",

          started_at AS "startedAt",
          last_progress_at AS "lastProgressAt",
          completed_at AS "completedAt"

        FROM delivery_routes

        WHERE completed_at IS NULL

        ORDER BY id
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(
      "Failed to fetch delivery routes:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch delivery routes",
    });
  }
});

app.patch("/api/orders/:id/vehicle", async (req, res) => {
  const client = await pool.connect();

  try {
    const { vehicleId } = req.body as {
      vehicleId?: string;
    };

    if (!vehicleId) {
      return res.status(400).json({
        message: "vehicleId is required",
      });
    }

    await client.query("BEGIN");

    // Блокируем заказ на время изменения машины.
    const orderResult = await client.query(
      `
        SELECT
          id,
          status,
          driver_id AS "driverId",
          vehicle_id AS "vehicleId",
          delivery_address_id AS "deliveryAddressId",
          client_id AS "clientId",
          eta
        FROM orders
        WHERE id = $1
        FOR UPDATE
      `,
      [req.params.id]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    // Нельзя менять машину для уже выполняемого
    // или завершённого заказа.
    if (
      order.status === "in-progress" ||
      order.status === "completed"
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Vehicle cannot be reassigned for this order status",
      });
    }

    // Если выбрана та же самая машина,
    // ничего менять не нужно.
    if (order.vehicleId === vehicleId) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "This vehicle is already assigned to the order",
      });
    }

    // Блокируем выбранную машину.
    const vehicleResult = await client.query(
      `
        SELECT
          id,
          status
        FROM vehicles
        WHERE id = $1
        FOR UPDATE
      `,
      [vehicleId]
    );

    if (vehicleResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const vehicle = vehicleResult.rows[0];

    if (vehicle.status !== "idle") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Vehicle is not available",
      });
    }

    // Проверяем, не назначена ли машина
    // другому активному заказу.
    const activeVehicleOrderResult = await client.query(
      `
        SELECT
          id,
          status
        FROM orders
        WHERE vehicle_id = $1
          AND id <> $2
          AND status IN (
            'assigned',
            'in-progress',
            'delayed'
          )
        LIMIT 1
      `,
      [vehicleId, order.id]
    );

    if (activeVehicleOrderResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Vehicle is already assigned to an active order",
      });
    }

    // Проверяем водителя заказа.
    const driverResult = await client.query(
      `
        SELECT
          id,
          status,
          vehicle_id AS "vehicleId"
        FROM drivers
        WHERE id = $1
        FOR UPDATE
      `,
      [order.driverId]
    );

    if (driverResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "Order driver not found",
      });
    }

    const driver = driverResult.rows[0];

    // Если водитель уже жёстко закреплён
    // за другой машиной, нельзя назначить ему новую.
    if (
      driver.vehicleId &&
      driver.vehicleId !== vehicleId
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message:
          "Selected driver is assigned to another vehicle",
      });
    }

    const updateResult = await client.query(
      `
        UPDATE orders
        SET vehicle_id = $1
        WHERE id = $2
        RETURNING
          id,
          client_id AS "clientId",
          delivery_address_id AS "deliveryAddressId",
          driver_id AS "driverId",
          vehicle_id AS "vehicleId",
          status,
          eta
      `,
      [vehicleId, order.id]
    );

    const updatedOrder = updateResult.rows[0];

    const addressResult = await client.query(
      `
        SELECT
          address,
          latitude,
          longitude
        FROM delivery_addresses
        WHERE id = $1
      `,
      [updatedOrder.deliveryAddressId]
    );

    const deliveryAddress = addressResult.rows[0];

    await client.query("COMMIT");

    return res.json({
      id: updatedOrder.id,
      clientId: updatedOrder.clientId,
      status: updatedOrder.status,
      address: deliveryAddress?.address ?? "—",
      eta: updatedOrder.eta ?? "—",
      vehicleId: updatedOrder.vehicleId,
      driverId: updatedOrder.driverId,
      deliveryAddress: {
        id: updatedOrder.deliveryAddressId,
        latitude: deliveryAddress?.latitude ?? null,
        longitude: deliveryAddress?.longitude ?? null,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Failed to assign vehicle to order:",
      error
    );

    return res.status(500).json({
      message: "Failed to assign vehicle to order",
    });
  } finally {
    client.release();
  }
});

/* -------------------------------------------------------------------------- */
/*                                      User                                  */
/* -------------------------------------------------------------------------- */

app.get("/api/user", (_req, res) => {
  res.json(user);
});

/* -------------------------------------------------------------------------- */
/*                                Notifications                               */
/* -------------------------------------------------------------------------- */

app.get("/api/notifications", async (_req, res) => {
  const result = await pool.query(
    `
      SELECT
        id,
        text,
        read
      FROM notifications
      ORDER BY id
    `
  );

  return res.json(result.rows);
});

app.patch(
  "/api/notifications/:id/read",
  async (req, res) => {
    const id = Number(req.params.id);

    const result = await pool.query(
      `
        UPDATE notifications
        SET read = TRUE
        WHERE id = $1
        RETURNING
          id,
          text,
          read
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.json(result.rows[0]);
  }
);

/* -------------------------------------------------------------------------- */
/*                                   Server                                   */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});