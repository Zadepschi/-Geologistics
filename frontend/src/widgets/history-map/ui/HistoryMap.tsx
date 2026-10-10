
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import type { Order } from "@/entities/order";

import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./HistoryMap.module.scss";

type HistoryRoute = {
  id: number;
  orderId: string;
  vehicleId: string;
  driverId: string;
  startLat: number;
  startLng: number;
  finishLat: number;
  finishLng: number;
  path: [number, number][];
  currentPathIndex: number;
  startedAt: string;
  lastProgressAt: string;
  completedAt: string | null;
};

type HistoryMapProps = {
  order: Order | null;
};

const routeSourceId = "history-selected-route";
const routeLayerId = "history-selected-route-line";

const toLineFeature = (coordinates: [number, number][]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates,
  },
});

const createRoutePointElement = (kind: "start" | "finish") => {
  const element = document.createElement("div");

  element.className =
    kind === "start"
      ? styles.routePointStart
      : styles.routePointFinish;

  return element;
};

export const HistoryMap = ({ order }: HistoryMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const finishMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [routes, setRoutes] = useState<HistoryRoute[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Загружаем завершённые маршруты из History API.
  useEffect(() => {
    const controller = new AbortController();

    const loadHistoryRoutes = async () => {
      try {
        setError(null);

        const response = await fetch(
          "/api/orders/delivery-routes/history",
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load history routes: ${response.status}`,
          );
        }

        const data: HistoryRoute[] = await response.json();
        setRoutes(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        console.error("Failed to load history routes", err);
        setError("Failed to load delivery route");
      }
    };

    void loadHistoryRoutes();

    return () => controller.abort();
  }, []);

  // Создаём карту.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_TOKEN;

    if (!token) {
      console.error("VITE_MAPBOX_TOKEN is not defined");
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-74.006, 40.7128],
      zoom: 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.on("load", () => setIsMapLoaded(true));

    mapRef.current = map;

    return () => {
      startMarkerRef.current?.remove();
      finishMarkerRef.current?.remove();

      startMarkerRef.current = null;
      finishMarkerRef.current = null;

      map.remove();
      mapRef.current = null;
      setIsMapLoaded(false);
    };
  }, []);

  // Рисуем маршрут выбранного завершённого заказа.
 
useEffect(() => {
  const map = mapRef.current;

  if (!map || !isMapLoaded || !map.isStyleLoaded()) {
    return;
  }
const clearRoute = () => {
  // Карта уже удаляется или заменена — ничего не трогаем.
  if (mapRef.current !== map) {
    return;
  }

  startMarkerRef.current?.remove();
  finishMarkerRef.current?.remove();

  startMarkerRef.current = null;
  finishMarkerRef.current = null;

  if (!map.isStyleLoaded()) {
    return;
  }

  if (map.getLayer(routeLayerId)) {
    map.removeLayer(routeLayerId);
  }

  if (map.getSource(routeSourceId)) {
    map.removeSource(routeSourceId);
  }
};

  clearRoute();

  if (!order) {
    return;
  }

  const route = routes.find(
    (item) => item.orderId === order.id,
  );

  if (!route || !Array.isArray(route.path)) {
    return;
  }

  const validPath = route.path.filter(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      Number.isFinite(point[0]) &&
      Number.isFinite(point[1]),
  );

  if (validPath.length < 2) {
    return;
  }

  map.addSource(routeSourceId, {
    type: "geojson",
    data: toLineFeature(validPath),
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
      "line-opacity": 0.9,
    },
  });

  startMarkerRef.current = new mapboxgl.Marker(
    createRoutePointElement("start"),
  )
    .setLngLat(validPath[0])
    .addTo(map);

  finishMarkerRef.current = new mapboxgl.Marker(
    createRoutePointElement("finish"),
  )
    .setLngLat(validPath[validPath.length - 1])
    .addTo(map);

  const bounds = new mapboxgl.LngLatBounds();

  validPath.forEach((point) => bounds.extend(point));

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 15,
    duration: 700,
  });

  return clearRoute;
}, [order, routes, isMapLoaded]);


  return (
    <div className={styles.map}>
      <div ref={mapContainerRef} className={styles.mapContainer} />

      {error && <div className={styles.mapMessage}>{error}</div>}

      {!order && (
        <div className={styles.mapMessage}>
          Select an order to view its delivery route
        </div>
      )}
    </div>
  );
};
