
import type { LngLat } from "@/entities/vehicle/model/types";

interface MapboxDirectionsResponse {
  code?: string;
  message?: string;
  routes?: Array<{
    duration?: number;
    geometry?: {
      coordinates?: LngLat[];
    };
  }>;
}

export interface StreetRoute {
  path: LngLat[];
  durationMinutes: number;
}

const isValidLngLat = (point: LngLat): boolean =>
  Array.isArray(point) &&
  point.length === 2 &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]) &&
  point[0] >= -180 &&
  point[0] <= 180 &&
  point[1] >= -90 &&
  point[1] <= 90;

const fetchMapboxRoute = async (
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<StreetRoute> => {
  if (!token) {
    throw new Error("Mapbox token is missing.");
  }

  if (!isValidLngLat(start) || !isValidLngLat(finish)) {
    throw new Error(
      `Invalid route coordinates. Start: ${JSON.stringify(start)}, finish: ${JSON.stringify(finish)}`
    );
  }

  const coords =
    `${start[0]},${start[1]};${finish[0]},${finish[1]}`;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url);

  const data = (await res.json()) as MapboxDirectionsResponse;

  if (!res.ok) {
    console.error("Mapbox Directions API error:", {
      status: res.status,
      code: data.code,
      message: data.message,
      start,
      finish,
    });

    throw new Error(
      `Mapbox route error ${res.status}: ${data.message || data.code || "Unknown error"}`
    );
  }

  const route = data.routes?.[0];
  const path = route?.geometry?.coordinates;
  const duration = route?.duration;

  if (!path || path.length < 2) {
    throw new Error(
      `Mapbox returned no usable route: ${data.code || "NoRoute"}`
    );
  }

  if (typeof duration !== "number") {
    throw new Error("Mapbox route duration is missing.");
  }

  return {
    path,
    durationMinutes: Math.ceil(duration / 60),
  };
};

export async function fetchStreetRoute(
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<LngLat[]> {
  const route = await fetchMapboxRoute(start, finish, token);
  return route.path;
}

export async function fetchStreetRouteWithDuration(
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<StreetRoute> {
  return fetchMapboxRoute(start, finish, token);
}
