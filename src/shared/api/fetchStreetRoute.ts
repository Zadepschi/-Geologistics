export type LngLat = [number, number];

export async function fetchStreetRoute(
  start: LngLat,
  finish: LngLat,
  token: string
): Promise<LngLat[]> {
  const coords = `${start[0]},${start[1]};${finish[0]},${finish[1]}`;

  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&access_token=${token}`;

  const res = await fetch(url);

  if (!res.ok) throw new Error("Mapbox route error");

  const data = await res.json();

  return data.routes?.[0]?.geometry?.coordinates ?? [];
}