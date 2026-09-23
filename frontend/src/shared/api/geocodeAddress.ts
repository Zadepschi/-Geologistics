export interface GeocodedAddress {
  latitude: number;
  longitude: number;
}

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN;

export async function geocodeAddress(
  address: string
): Promise<GeocodedAddress> {
  const encodedAddress =
    encodeURIComponent(address);

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward` +
    `?q=${encodedAddress}` +
    `&limit=1` +
    `&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Failed to geocode address"
    );
  }

  const data = await response.json();

  const coordinates =
    data.features?.[0]?.geometry?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    throw new Error(
      "Address coordinates not found"
    );
  }

  return {
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
}