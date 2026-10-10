import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          text,
          read,
          created_at AS "createdAt"
        FROM notifications
        ORDER BY created_at DESC, id DESC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

router.patch("/:id/read", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid notification id",
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE notifications
        SET read = TRUE
        WHERE id = $1
        RETURNING
          id,
          text,
          read,
          created_at AS "createdAt"
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to mark notification as read:", error);

    return res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
});

export default router;