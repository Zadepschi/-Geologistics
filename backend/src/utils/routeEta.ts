
type Coordinate = [number, number]; // [longitude, latitude]

const EARTH_RADIUS_KM = 6371;

function distanceKm(a: Coordinate, b: Coordinate): number {
  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const [lon1, lat1] = a.map(toRadians);
  const [lon2, lat2] = b.map(toRadians);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KM *
    Math.asin(Math.sqrt(Math.min(1, haversine)))
  );
}

export function remainingDistanceKm(
  path: Coordinate[],
  currentPathIndex: number,
): number {
  if (path.length < 2) return 0;

  const startIndex = Math.max(
    0,
    Math.min(currentPathIndex, path.length - 1),
  );

  let total = 0;

  for (let i = startIndex; i < path.length - 1; i++) {
    total += distanceKm(path[i], path[i + 1]);
  }

  return total;
}

export function calculateEtaMinutes(
  path: Coordinate[],
  currentPathIndex: number,
  speedKmH: number,
): number {
  const distance = remainingDistanceKm(
    path,
    currentPathIndex,
  );

  if (distance <= 0) return 0;
  if (!Number.isFinite(speedKmH) || speedKmH <= 0) {
    return 0;
  }

  return Math.ceil((distance / speedKmH) * 60);
}
