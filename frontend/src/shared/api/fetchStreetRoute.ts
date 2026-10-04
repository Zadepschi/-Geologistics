import type { LngLat } from "@/entities/vehicle/model/types";

interface MapboxDirectionsResponse {
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

const fetchMapboxRoute = async (
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<StreetRoute> => {
  if (!token) {
    throw new Error("Mapbox token is missing");
  }

  const coords = `${start[0]},${start[1]};${finish[0]},${finish[1]}`;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Mapbox route error: ${res.status}`);
  }

  const data: MapboxDirectionsResponse =
    await res.json();

  const route = data.routes?.[0];

  const path = route?.geometry?.coordinates;
  const duration = route?.duration;

  if (!path || path.length < 2) {
    throw new Error("Mapbox route geometry is empty");
  }

  if (typeof duration !== "number") {
    throw new Error("Mapbox route duration is missing");
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
  const route = await fetchMapboxRoute(
    start,
    finish,
    token
  );

  return route.path;
}

export async function fetchStreetRouteWithDuration(
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<StreetRoute> {
  return fetchMapboxRoute(start, finish, token);
}