import { http, HttpResponse } from "msw";
import { vehicles as baseVehicles } from "./data/vehicles";

const delay = (ms: number) =>
  new Promise((res) => setTimeout(res, ms));

export const handlers = [
  http.get("/api/vehicles", async () => {
    await delay(300);

    return HttpResponse.json(baseVehicles);
  }),

  http.get("/api/user", async () => {
    await delay(200);

    return HttpResponse.json({
      id: 1,
      name: "John Doe",
    });
  }),

  http.get("/api/notifications", async () => {
    await delay(200);

    return HttpResponse.json([
      {
        id: 1,
        text: "New delivery assigned",
        read: false,
      },
      {
        id: 2,
        text: "Vehicle arrived at destination",
        read: false,
      },
      {
        id: 3,
        text: "Delivery completed",
        read: true,
      },
    ]);
  }),
];