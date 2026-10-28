
export interface GeocodedAddress {
  latitude: number;
  longitude: number;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export async function geocodeAddress(
  address: string
): Promise<GeocodedAddress> {
  if (!MAPBOX_TOKEN) {
    throw new Error("Mapbox token is missing.");
  }

  if (!address.trim()) {
    throw new Error("Delivery address is empty.");
  }

  const params = new URLSearchParams({
    q: address.trim(),
    country: "US",
    types: "address",
    limit: "1",
    autocomplete: "false",
    access_token: MAPBOX_TOKEN,
  });

  const url =
    `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Mapbox geocoding error:", data);

    throw new Error(
      `Geocoding error ${response.status}: ${
        data.message || "Failed to geocode address"
      }`
    );
  }

  const coordinates =
    data.features?.[0]?.geometry?.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    throw new Error(
      `Valid coordinates not found for address: ${address}`
    );
  }

  return {
    longitude: coordinates[0],
    latitude: coordinates[1],
  };
}
