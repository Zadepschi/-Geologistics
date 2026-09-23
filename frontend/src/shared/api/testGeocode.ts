import { geocodeAddress } from "./geocodeAddress";

geocodeAddress("238 Park Ave, Brooklyn, NY")
  .then((result) => {
    console.log("Geocoded address:", result);
  })
  .catch((error) => {
    console.error("Geocoding failed:", error);
  });