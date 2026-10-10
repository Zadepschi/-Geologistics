import type { Request, Response } from "express";

import * as clientService from "../services/clientService.js";

export async function getClients(
  _req: Request,
  res: Response,
) {
  try {
    const clients = await clientService.getClients();

    return res.json(clients);
  } catch (error) {
    console.error("Failed to fetch clients:", error);

    return res.status(500).json({
      message: "Failed to fetch clients",
    });
  }
}

export async function createClient(
  req: Request,
  res: Response,
) {
  try {
    const client = await clientService.createClient(
      req.body,
    );

    return res.status(201).json(client);
  } catch (error) {
    console.error("Failed to create client:", error);

    if (
      error instanceof Error &&
      error.message ===
        "name, phone, email and address are required"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create client",
    });
  }
}

export async function updateClient(
  req: Request,
  res: Response,
) {
  try {
    const id = String(req.params.id);

    const client = await clientService.updateClient(
      id,
      req.body,
    );

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    return res.json(client);
  } catch (error) {
    console.error("Failed to update client:", error);

    if (
      error instanceof Error &&
      error.message ===
        "name, phone, email and address are required"
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update client",
    });
  }
}

export async function archiveClient(
  req: Request,
  res: Response,
) {
  try {
    const id = String(req.params.id);

    const isArchived =
      req.body?.isArchived !== false;

    const client =
      await clientService.archiveClient(
        id,
        isArchived,
      );

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    return res.json(client);
  } catch (error) {
    console.error(
      "Failed to archive client:",
      error,
    );

    return res.status(500).json({
      message: "Failed to archive client",
    });
  }
}