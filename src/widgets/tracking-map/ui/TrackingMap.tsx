import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/shared/ui/card/Card";
import { useFleetStore } from "@/shared/store/fleet";
import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { useLiveTracking } from "@/features/live-tracking/model/useLiveTracking";
import styles from "./TrackingMap.module.scss";
import type { Vehicle } from "@/entities/vehicle/model/types";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const routeSourceId = "selected-vehicle-route";
const routeLayerId = "selected-vehicle-route-line";

const completedRouteSourceId = "selected-vehicle-route-completed";
const completedRouteLayerId = "selected-vehicle-route-completed-line";

const toLineFeature = (coordinates: [number, number][]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates,
  },
});

const createVehicleMarkerElement = (vehicle: Vehicle, active: boolean) => {
  const el = document.createElement("button");
  el.type = "button";
  el.className = styles.vehicleMarker;
  el.dataset.type = vehicle.type;

  if (active) {
    el.classList.add(styles.vehicleMarkerActive);
  }

  return el;
};

const createRoutePointElement = (
  kind: "start" | "finish",
  type: Vehicle["type"]
) => {
  const el = document.createElement("div");
  el.className =
    kind === "start" ? styles.routePointStart : styles.routePointFinish;
  el.dataset.type = type;
  return el;
};

export const TrackingMap = () => {
  useLoadVehicles();
  useLiveTracking();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const vehicleMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const finishMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const focusedVehicleIdRef = useRef<string | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const vehicles = useFleetStore((s) => s.vehicles);
  const selectedVehicleId = useFleetStore((s) => s.selectedVehicleId);
  const setSelectedVehicleId = useFleetStore((s) => s.setSelectedVehicleId);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null;

  const clearSelectedRoute = (map: mapboxgl.Map) => {
    if (map.getLayer(routeLayerId)) {
      map.removeLayer(routeLayerId);
    }

    if (map.getSource(routeSourceId)) {
      map.removeSource(routeSourceId);
    }

    if (map.getLayer(completedRouteLayerId)) {
      map.removeLayer(completedRouteLayerId);
    }

    if (map.getSource(completedRouteSourceId)) {
      map.removeSource(completedRouteSourceId);
    }

    startMarkerRef.current?.remove();
    finishMarkerRef.current?.remove();
    startMarkerRef.current = null;
    finishMarkerRef.current = null;
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.006, 40.7128],
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      setIsMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      vehicleMarkersRef.current.forEach((marker) => marker.remove());
      vehicleMarkersRef.current.clear();

      clearSelectedRoute(map);

      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const currentIds = new Set(vehicles.map((vehicle) => vehicle.id));
    const existingIds = new Set(vehicleMarkersRef.current.keys());

    vehicles.forEach((vehicle) => {
      const existingMarker = vehicleMarkersRef.current.get(vehicle.id);

      if (existingMarker) {
        existingMarker.setLngLat([
          vehicle.telemetry.lng,
          vehicle.telemetry.lat,
        ]);

        const el = existingMarker.getElement() as HTMLButtonElement;
        el.className = styles.vehicleMarker;
        el.dataset.type = vehicle.type;

        if (vehicle.id === selectedVehicleId) {
          el.classList.add(styles.vehicleMarkerActive);
        }

        return;
      }

      const el = createVehicleMarkerElement(
        vehicle,
        vehicle.id === selectedVehicleId
      );

      el.onclick = () => {
        setSelectedVehicleId(vehicle.id);
      };

      const marker = new mapboxgl.Marker(el)
        .setLngLat([vehicle.telemetry.lng, vehicle.telemetry.lat])
        .addTo(map);

      vehicleMarkersRef.current.set(vehicle.id, marker);
    });

    existingIds.forEach((id) => {
      if (currentIds.has(id)) return;

      const marker = vehicleMarkersRef.current.get(id);
      marker?.remove();
      vehicleMarkersRef.current.delete(id);
    });
  }, [vehicles, selectedVehicleId, setSelectedVehicleId, isMapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (!selectedVehicle) {
      clearSelectedRoute(map);
      focusedVehicleIdRef.current = null;
      return;
    }

    const routePath = selectedVehicle.route?.path ?? [];
    const completedPath = selectedVehicle.route?.completedPath ?? [];

    if (routePath.length < 2) {
      clearSelectedRoute(map);
      return;
    }

    const fullRouteData = toLineFeature(routePath);
    const fullRouteSource = map.getSource(routeSourceId) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (fullRouteSource) {
      fullRouteSource.setData(fullRouteData);
    } else {
      map.addSource(routeSourceId, {
        type: "geojson",
        data: fullRouteData,
      });

      map.addLayer({
        id: routeLayerId,
        type: "line",
        source: routeSourceId,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-width": 4,
          "line-color": "#60a5fa",
          "line-opacity": 0.35,
        },
      });
    }

    if (completedPath.length >= 2) {
      const completedRouteData = toLineFeature(completedPath);
      const completedRouteSource = map.getSource(completedRouteSourceId) as
        | mapboxgl.GeoJSONSource
        | undefined;

      if (completedRouteSource) {
        completedRouteSource.setData(completedRouteData);
      } else {
        map.addSource(completedRouteSourceId, {
          type: "geojson",
          data: completedRouteData,
        });

        map.addLayer({
          id: completedRouteLayerId,
          type: "line",
          source: completedRouteSourceId,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-width": 5,
            "line-color": "#2563eb",
          },
        });
      }
    } else {
      if (map.getLayer(completedRouteLayerId)) {
        map.removeLayer(completedRouteLayerId);
      }

      if (map.getSource(completedRouteSourceId)) {
        map.removeSource(completedRouteSourceId);
      }
    }

    startMarkerRef.current?.remove();
    finishMarkerRef.current?.remove();

    if (selectedVehicle.route?.start) {
      startMarkerRef.current = new mapboxgl.Marker(
        createRoutePointElement("start", selectedVehicle.type)
      )
        .setLngLat(selectedVehicle.route.start)
        .addTo(map);
    }

    if (selectedVehicle.route?.finish) {
      finishMarkerRef.current = new mapboxgl.Marker(
        createRoutePointElement("finish", selectedVehicle.type)
      )
        .setLngLat(selectedVehicle.route.finish)
        .addTo(map);
    }

    const shouldFocusSelectedVehicle =
      focusedVehicleIdRef.current !== selectedVehicle.id;

    focusedVehicleIdRef.current = selectedVehicle.id;

    if (shouldFocusSelectedVehicle) {
      map.easeTo({
        center: [selectedVehicle.telemetry.lng, selectedVehicle.telemetry.lat],
        zoom: 13,
        duration: 700,
      });
    }
  }, [selectedVehicle, isMapLoaded]);

  return (
    <Card className={styles.map}>
      <div ref={mapContainerRef} className={styles.mapContainer} />
    </Card>
  );
};