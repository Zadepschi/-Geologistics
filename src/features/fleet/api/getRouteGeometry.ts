import type { LngLat } from "@/entities/vehicle/model/types";

interface MapboxDirectionsResponse {
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
    duration?: number;
  }>;
}

export const getRouteGeometry = async (
  start: LngLat,
  finish: LngLat
): Promise<LngLat[]> => {
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  const coordinates = `${start[0]},${start[1]};${finish[0]},${finish[1]}`;
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch route: ${res.status}`);
  }

  const data: MapboxDirectionsResponse = await res.json();
  const route = data.routes?.[0]?.geometry?.coordinates;

  if (!route || route.length < 2) {
    throw new Error("Route geometry is empty");
  }

  return route;
};