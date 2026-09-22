import type { LngLat } from "@/entities/vehicle/model/types";

interface MapboxDirectionsResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: LngLat[];
    };
  }>;
}

export async function fetchStreetRoute(
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<LngLat[]> {
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

  const data: MapboxDirectionsResponse = await res.json();

  const route = data.routes?.[0]?.geometry?.coordinates;

  if (!route || route.length < 2) {
    throw new Error("Mapbox route geometry is empty");
  }

  return route;
}