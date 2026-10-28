
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { timingSafeEqual, randomUUID } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

function authenticateStyleBox(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const expected = process.env.STYLEBOX_INTEGRATION_SECRET;
  const received = req.get("x-stylebox-secret");

  if (!expected || !received) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

router.post(
  "/shipments",
  authenticateStyleBox,
  async (req: Request, res: Response) => {
    const {
      externalOrderId,
      externalCustomerId,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      latitude,
      longitude,
    } = req.body ?? {};
    console.log("StyleBox address fields:", {
  address,
  city,
  postalCode,
});

    const requiredStrings = [
      externalOrderId,
      externalCustomerId,
      firstName,
      lastName,
      email,
      phone,
      address,
    ];

    if (
      !requiredStrings.every(
        (value) => typeof value === "string" && value.trim().length > 0,
      ) ||
      externalOrderId.trim().length > 100 ||
      externalCustomerId.trim().length > 255 ||
      firstName.trim().length > 100 ||
      lastName.trim().length > 100 ||
      email.trim().length > 255 ||
      phone.trim().length > 50 ||
      (typeof city !== "undefined" && city !== null && typeof city !== "string") ||
      (typeof postalCode !== "undefined" &&
        postalCode !== null &&
        typeof postalCode !== "string") ||
      typeof latitude !== "number" ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      typeof longitude !== "number" ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({ error: "Invalid shipment data" });
    }

    const externalId = externalOrderId.trim();
    const customerId = externalCustomerId.trim();
    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
 
const normalizedAddress = address.trim();
const normalizedCity =
  typeof city === "string" ? city.trim() : "";
const normalizedPostalCode =
  typeof postalCode === "string" ? postalCode.trim() : "";

const fullClientAddress = [
  normalizedAddress,
  normalizedCity,
  normalizedPostalCode,
]
  .filter(Boolean)
  .join(", ");

  console.log("Full client address:", fullClientAddress);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Защита от повторного получения одного заказа.
      const existingOrder = await client.query(
        `SELECT
           o.id,
           o.client_id AS "clientId",
           o.status,
           o.external_order_id AS "externalOrderId",
           o.shipment_number AS "shipmentNumber",
           c.external_customer_id AS "externalCustomerId",
           c.source
         FROM orders o
         LEFT JOIN clients c ON c.id = o.client_id
         WHERE o.external_order_id = $1
         FOR UPDATE OF o`,
        [externalId],
      );

      if (existingOrder.rows.length > 0) {
        const order = existingOrder.rows[0];

        await client.query("COMMIT");

        if (
          order.source !== "StyleBox" ||
          order.externalCustomerId !== customerId
        ) {
          return res.status(409).json({
            error: "External order ID already belongs to another customer",
          });
        }

        return res.status(200).json({
          message: "Shipment already received",
          duplicate: true,
          order: {
            id: order.id,
            clientId: order.clientId,
            status: order.status,
            externalOrderId: order.externalOrderId,
            shipmentNumber: order.shipmentNumber,
          },
        });
      }

      // Находим покупателя или создаём его один раз.
      // Один внешний ID покупателя = одна карточка клиента StyleBox.
      const customerResult = await client.query(
        `INSERT INTO clients (
           id,
           name,
           phone,
           email,
           address,
           is_archived,
           external_customer_id,
           source
         )
         VALUES ($1, $2, $3, $4, $5, FALSE, $6, 'StyleBox')
         ON CONFLICT (source, external_customer_id)
           WHERE source IS NOT NULL
             AND external_customer_id IS NOT NULL
         DO UPDATE SET
           name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           email = EXCLUDED.email,
           address = EXCLUDED.address,
           is_archived = FALSE
         RETURNING id, name`,
        [
  `SB-${randomUUID().replace(/-/g, "").slice(0, 16)}`,
  `${normalizedFirstName} ${normalizedLastName}`,
  normalizedPhone,
  normalizedEmail,
  fullClientAddress,
  customerId,
],
      );

      const customer = customerResult.rows[0];

      // Адрес доставки хранится отдельно для каждого заказа.
      const addressResult = await client.query(
        `INSERT INTO delivery_addresses (
           address,
           city,
           postal_code,
           latitude,
           longitude,
           recipient_phone
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          normalizedAddress,
          normalizedCity || null,
          normalizedPostalCode || null,
          latitude,
          longitude,
          normalizedPhone,
        ],
      );

      const orderId = `ORD-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 12)}`;

      const shipmentNumber = `SHP-${randomUUID()
        .replace(/-/g, "")
        .slice(0, 12)
        .toUpperCase()}`;

      const orderResult = await client.query(
        `INSERT INTO orders (
           id,
           client_id,
           delivery_address_id,
           status,
           external_order_id,
           shipment_number
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING
           id,
           client_id AS "clientId",
           status,
           external_order_id AS "externalOrderId",
           shipment_number AS "shipmentNumber"`,
        [
          orderId,
          customer.id,
          addressResult.rows[0].id,
          "assigned",
          externalId,
          shipmentNumber,
        ],
      );

      await client.query("COMMIT");

      await pool.query(
  `
    INSERT INTO notifications (text, read, created_at)
    VALUES ($1, FALSE, NOW())
  `,
  [`New order from StyleBox: ${orderId}`]
);

      return res.status(201).json({
        message: "Shipment received",
        duplicate: false,
        customer: {
          id: customer.id,
          name: customer.name,
          source: "StyleBox",
          externalCustomerId: customerId,
        },
        order: orderResult.rows[0],
      });
    } catch (error: unknown) {
      await client.query("ROLLBACK").catch(() => {});

      const dbError = error as { code?: string };

      console.error("StyleBox shipment integration failed:", error);

      if (dbError.code === "23505") {
        return res.status(409).json({
          error: "Duplicate order or customer conflict",
        });
      }

      return res.status(500).json({
        error: "Failed to receive shipment",
      });
    } finally {
      client.release();
    }
  },
);


router.get(
  "/shipments/:externalOrderId/status",
  authenticateStyleBox,
  async (req: Request, res: Response) => {
    try {
      const externalOrderId = String(
        req.params.externalOrderId ?? "",
      ).trim();

      if (!externalOrderId) {
        return res.status(400).json({
          error: "External order ID is required",
        });
      }

      const result = await pool.query(
        `SELECT
           o.id AS "orderNumber",
           o.external_order_id AS "externalOrderId",
           o.status,
           o.driver_id AS "driverId",
           o.vehicle_id AS "vehicleId"
         FROM orders o
         JOIN clients c ON c.id = o.client_id
         WHERE o.external_order_id = $1
           AND c.source = 'StyleBox'
         LIMIT 1`,
        [externalOrderId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "Shipment not found",
        });
      }

      const order = result.rows[0];

      return res.json({
        order: {
          orderNumber: order.orderNumber,
          externalOrderId: order.externalOrderId,
          status: order.status,
          driverId: order.driverId,
          vehicleId: order.vehicleId,
        },
      });
    } catch (error) {
      console.error(
        "Failed to get StyleBox shipment status:",
        error,
      );

      return res.status(500).json({
        error: "Failed to get shipment status",
      });
    }
  },
);



export default router;
