import type { Request, Response } from "express";

import {
  OrderServiceError,
  listOrders,
  createOrder as createOrderService,
  updateOrder as updateOrderService,
  updateOrderStatus as updateOrderStatusService,
  advanceOrderProgress as advanceOrderProgressService,
  listDeliveryRoutes,
  listHistoryDeliveryRoutes,
  assignOrderVehicle as assignOrderVehicleService,
} from "../services/orderService.js";

function handleError(
  res: Response,
  error: unknown,
  defaultMessage: string,
) {
  if (error instanceof OrderServiceError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(defaultMessage, error);

  return res.status(500).json({
    message: defaultMessage,
  });
}

export async function getOrders(
  _req: Request,
  res: Response,
) {
  try {
    const orders = await listOrders();
    return res.json(orders);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to fetch orders",
    );
  }
}

export async function createOrder(
  req: Request,
  res: Response,
) {
  try {
    const order = await createOrderService(req.body);

    return res.status(201).json(order);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to create order",
    );
  }
}

export async function updateOrder(
  req: Request,
  res: Response,
) {
  try {
    const order = await updateOrderService(
      String(req.params.id),
      req.body,
    );

    return res.json(order);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to update order",
    );
  }
}

export async function updateOrderStatus(
  req: Request,
  res: Response,
) {
  try {
    const order = await updateOrderStatusService(
      String(req.params.id),
      req.body,
    );

    return res.json(order);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to update order status",
    );
  }
}

export async function advanceOrderProgress(
  req: Request,
  res: Response,
) {
  try {
    const result =
      await advanceOrderProgressService(
        String(req.params.id),
      );

    return res.json(result);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to advance delivery progress",
    );
  }
}

export async function getDeliveryRoutes(
  _req: Request,
  res: Response,
) {
  try {
    const routes = await listDeliveryRoutes();

    return res.json(routes);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to fetch delivery routes",
    );
  }
}

export async function getHistoryDeliveryRoutes(
  _req: Request,
  res: Response,
) {
  try {
    const routes =
      await listHistoryDeliveryRoutes();

    return res.json(routes);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to fetch history delivery routes",
    );
  }
}

export async function assignOrderVehicle(
  req: Request,
  res: Response,
) {
  try {
    const order =
      await assignOrderVehicleService(
        String(req.params.id),
        req.body,
      );

    return res.json(order);
  } catch (error) {
    return handleError(
      res,
      error,
      "Failed to assign vehicle to order",
    );
  }
}