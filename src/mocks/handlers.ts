import { http, HttpResponse } from "msw";
import { vehicles as baseVehicles } from "./data/vehicles";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const handlers = [
  http.get("/api/vehicles", async () => {
    await delay(300);
    return HttpResponse.json(baseVehicles);
  }),
];