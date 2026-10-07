import { useEffect, useRef, useState } from "react";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { Card } from "@/shared/ui/card/Card";

import type { Order } from "@/entities/order";

import { fetchOrders } from "@/shared/api/orders";

import { useFleetStore } from "@/shared/store/fleet";

import { useLoadVehicles } from "@/features/fleet/model/useLoadVehicles";
import { useLiveTracking } from "@/features/live-tracking/model/useLiveTracking";

import { useOrdersLayerStore } from "@/features/toggle-orders-layer/model/store";
import { useMapThemeStore } from "@/features/switch-map-theme/model/store";
import { useClustersStore } from "@/features/switch-clusters/model/store";

import type { Vehicle } from "@/entities/vehicle/model/types";

import styles from "./TrackingMap.module.scss";

mapboxgl.accessToken =
  import.meta.env.VITE_MAPBOX_TOKEN;

const routeSourceId =
  "selected-vehicle-route";

const routeLayerId =
  "selected-vehicle-route-line";

const completedRouteSourceId =
  "selected-vehicle-route-completed";

const completedRouteLayerId =
  "selected-vehicle-route-completed-line";

const ordersSourceId =
  "orders-source";

const ordersLayerId =
  "orders-layer";

const ordersClusterLayerId =
  "orders-clusters";

const ordersClusterCountLayerId =
  "orders-cluster-count";

const resetMapCursor = (
  map: mapboxgl.Map
) => {
  try {
    const canvas = map.getCanvas();

    if (canvas) {
      canvas.style.cursor = "";
    }
  } catch {
    // Mapbox canvas may already be removed during unmount.
  }
};

const setMapPointerCursor = (
  map: mapboxgl.Map
) => {
  try {
    const canvas = map.getCanvas();

    if (canvas) {
      canvas.style.cursor = "pointer";
    }
  } catch {
    // Mapbox canvas may already be removed during unmount.
  }
};

const toLineFeature = (
  coordinates: [number, number][]
) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates,
  },
});

const createRoutePointElement = (
  kind: "start" | "finish",
  type: Vehicle["type"]
) => {
  const el = document.createElement("div");

  el.className =
    kind === "start"
      ? styles.routePointStart
      : styles.routePointFinish;

  el.dataset.type = type;

  return el;
};

const getVehicleStatusLabel = (
  status: Vehicle["status"]
) => {
  switch (status) {
    case "on-route":
      return "On route";

    case "idle":
      return "Idle";

    case "maintenance":
      return "Maintenance";

    case "delayed":
      return "Delayed";

    default:
      return status;
  }
};

const getOrderStatusLabel = (
  status: Order["status"]
) => {
  switch (status) {
    case "in-progress":
      return "In progress";

    case "completed":
      return "Completed";

    case "delayed":
      return "Delayed";

    default:
      return status;
  }
};

const getVehicleOrder = (
  vehicle: Vehicle,
  orders: Order[]
) => {
  const assignedOrders =
    orders.filter(
      (order) =>
        order.vehicleId === vehicle.id
    );

  if (assignedOrders.length === 0) {
    return null;
  }

  return (
    assignedOrders.find(
      (order) =>
        order.status !== "completed"
    ) ?? assignedOrders[0]
  );
};

const createOrderPopupContent = (
  vehicle: Vehicle,
  order: Order | null
) => {
  const container =
    document.createElement("div");

  container.className =
    styles.orderPopupContent;

  const vehicleTitle =
    document.createElement("div");

  vehicleTitle.className =
    styles.orderPopupTitle;

  vehicleTitle.textContent =
    vehicle.name;

  const vehicleStatus =
    document.createElement("div");

  vehicleStatus.className =
    styles.orderPopupRow;

  const vehicleStatusLabel =
    document.createElement("span");

  vehicleStatusLabel.textContent =
    "Status";

  const vehicleStatusValue =
    document.createElement("strong");

  vehicleStatusValue.textContent =
    getVehicleStatusLabel(
      vehicle.status
    );

  vehicleStatus.append(
    vehicleStatusLabel,
    vehicleStatusValue
  );

  const vehicleSpeed =
    document.createElement("div");

  vehicleSpeed.className =
    styles.orderPopupRow;

  const vehicleSpeedLabel =
    document.createElement("span");

  vehicleSpeedLabel.textContent =
    "Speed";

  const vehicleSpeedValue =
    document.createElement("strong");

  vehicleSpeedValue.textContent = `${vehicle.telemetry.speedKmH ?? 0} km/h`;

  vehicleSpeed.append(
    vehicleSpeedLabel,
    vehicleSpeedValue
  );

  container.append(
    vehicleTitle,
    vehicleStatus,
    vehicleSpeed
  );

  if (order) {
    const divider =
      document.createElement("div");

    divider.className =
      styles.orderPopupDivider;

    const orderTitle =
      document.createElement("div");

    orderTitle.className =
      styles.orderPopupOrderTitle;

    orderTitle.textContent =
      order.id;

    const orderStatus =
      document.createElement("div");

    orderStatus.className =
      styles.orderPopupRow;

    const orderStatusLabel =
      document.createElement("span");

    orderStatusLabel.textContent =
      "Order status";

    const orderStatusValue =
      document.createElement("strong");

    orderStatusValue.textContent =
      getOrderStatusLabel(
        order.status
      );

    orderStatus.append(
      orderStatusLabel,
      orderStatusValue
    );

    const orderAddress =
      document.createElement("div");

    orderAddress.className =
      styles.orderPopupRow;

    const orderAddressLabel =
      document.createElement("span");

    orderAddressLabel.textContent =
      "Address";

    const orderAddressValue =
      document.createElement("strong");

    orderAddressValue.textContent =
      order.address;

    orderAddress.append(
      orderAddressLabel,
      orderAddressValue
    );

    const orderEta =
      document.createElement("div");

    orderEta.className =
      styles.orderPopupRow;

    const orderEtaLabel =
      document.createElement("span");

    orderEtaLabel.textContent =
      "ETA";

    const orderEtaValue =
      document.createElement("strong");

    orderEtaValue.textContent =
      order.eta;

    orderEta.append(
      orderEtaLabel,
      orderEtaValue
    );

    container.append(
      divider,
      orderTitle,
      orderStatus,
      orderAddress,
      orderEta
    );
  } else {
    const noOrder =
      document.createElement("div");

    noOrder.className =
      styles.orderPopupEmpty;

    noOrder.textContent =
      "No assigned order";

    container.append(noOrder);
  }

  return container;
};

export const TrackingMap = () => {
  /*
   * PostgreSQL is the source of truth.
   *
   * useLoadVehicles:
   * - loads vehicles;
   * - loads orders;
   * - restores persisted delivery routes;
   * - restores currentPathIndex;
   * - restores completedPath.
   *
   * useLiveTracking:
   * - asks backend for progress;
   * - backend calculates progress from lastProgressAt;
   * - frontend does not increment currentPathIndex itself.
   */
  useLoadVehicles();
  useLiveTracking();

  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<mapboxgl.Map | null>(
      null
    );

  const startMarkerRef =
    useRef<mapboxgl.Marker | null>(
      null
    );

  const finishMarkerRef =
    useRef<mapboxgl.Marker | null>(
      null
    );

  const orderPopupRef =
    useRef<mapboxgl.Popup | null>(
      null
    );

  const focusedVehicleIdRef =
    useRef<string | null>(null);

  const isInitialMapThemeRef =
    useRef(true);

  const vehiclesRef =
    useRef<Vehicle[]>([]);

  const ordersRef =
    useRef<Order[]>([]);

  const [isMapLoaded, setIsMapLoaded] =
    useState(false);

  const [styleVersion, setStyleVersion] =
    useState(0);

  const [orders, setOrders] =
    useState<Order[]>([]);

  const vehicles = useFleetStore(
    (s) => s.vehicles
  );

  const selectedVehicleId =
    useFleetStore(
      (s) => s.selectedVehicleId
    );

  const isOrdersVisible =
    useOrdersLayerStore(
      (s) => s.isVisible
    );

  const mapTheme =
    useMapThemeStore(
      (s) => s.theme
    );

  const clustersEnabled =
    useClustersStore(
      (s) => s.isEnabled
    );

  const selectedVehicle =
    vehicles.find(
      (vehicle) =>
        vehicle.id ===
        selectedVehicleId
    ) ?? null;

  vehiclesRef.current =
    vehicles;

  ordersRef.current =
    orders;

  const clearSelectedRoute = (
    map: mapboxgl.Map
  ) => {
    if (map.getLayer(routeLayerId)) {
      map.removeLayer(routeLayerId);
    }

    if (
      map.getSource(routeSourceId)
    ) {
      map.removeSource(routeSourceId);
    }

    if (
      map.getLayer(
        completedRouteLayerId
      )
    ) {
      map.removeLayer(
        completedRouteLayerId
      );
    }

    if (
      map.getSource(
        completedRouteSourceId
      )
    ) {
      map.removeSource(
        completedRouteSourceId
      );
    }

    startMarkerRef.current?.remove();
    finishMarkerRef.current?.remove();

    startMarkerRef.current = null;
    finishMarkerRef.current = null;
  };

  // Загружаем заказы для tooltip.
  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((error) => {
        console.error(
          "Failed to load orders",
          error
        );
      });
  }, []);

  // Инициализация карты.
  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map = new mapboxgl.Map({
      container:
        mapContainerRef.current,
      style:
        "mapbox://styles/mapbox/dark-v11",
      center: [-74.006, 40.7128],
      zoom: 11,
    });

    map.addControl(
      new mapboxgl.NavigationControl(),
      "bottom-right"
    );

    map.on("load", () => {
      setIsMapLoaded(true);
    });

    map.on("style.load", () => {
      setStyleVersion(
        (version) => version + 1
      );
    });

    mapRef.current = map;

    return () => {
      orderPopupRef.current?.remove();
      orderPopupRef.current = null;

      clearSelectedRoute(map);

      map.remove();
      mapRef.current = null;

      setIsMapLoaded(false);
    };
  }, []);

  // Переключение темы Mapbox.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapLoaded) {
      return;
    }

    if (
      isInitialMapThemeRef.current
    ) {
      isInitialMapThemeRef.current =
        false;

      return;
    }

    const style =
      mapTheme === "dark"
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v12";

    map.setStyle(style);
  }, [
    mapTheme,
    isMapLoaded,
  ]);

  // Orders layer + clusters.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapLoaded) {
      return;
    }

    const features = vehicles.map(
      (vehicle) => ({
        type: "Feature" as const,
        properties: {
          vehicleId: vehicle.id,
          vehicleName: vehicle.name,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [
            vehicle.telemetry.lng,
            vehicle.telemetry.lat,
          ],
        },
      })
    );

    const data = {
      type: "FeatureCollection" as const,
      features,
    };

    const existingSource =
      map.getSource(
        ordersSourceId
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (existingSource) {
      existingSource.setData(data);
    } else {
      map.addSource(
        ordersSourceId,
        {
          type: "geojson",
          data,
          cluster:
            clustersEnabled,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        }
      );
    }

    if (
      !map.getLayer(
        ordersLayerId
      )
    ) {
      map.addLayer({
        id: ordersLayerId,
        type: "circle",
        source: ordersSourceId,
        filter: [
          "!",
          ["has", "point_count"],
        ],
        paint: {
          "circle-radius": 7,
          "circle-color": "#f59e0b",
          "circle-stroke-width": 2,
          "circle-stroke-color":
            "#ffffff",
          "circle-opacity": 0.9,
        },
      });
    }

    if (
      !map.getLayer(
        ordersClusterLayerId
      )
    ) {
      map.addLayer({
        id: ordersClusterLayerId,
        type: "circle",
        source: ordersSourceId,
        filter: [
          "has",
          "point_count",
        ],
        paint: {
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,
            22,
            10,
            28,
          ],
          "circle-color": "#2563eb",
          "circle-stroke-width": 2,
          "circle-stroke-color":
            "#ffffff",
        },
      });
    }

    if (
      !map.getLayer(
        ordersClusterCountLayerId
      )
    ) {
      map.addLayer({
        id:
          ordersClusterCountLayerId,
        type: "symbol",
        source: ordersSourceId,
        filter: [
          "has",
          "point_count",
        ],
        layout: {
          "text-field":
            "{point_count_abbreviated}",
          "text-size": 12,
        },
        paint: {
          "text-color":
            "#ffffff",
        },
      });
    }

    map.setLayoutProperty(
      ordersLayerId,
      "visibility",
      isOrdersVisible
        ? "visible"
        : "none"
    );

    map.setLayoutProperty(
      ordersClusterLayerId,
      "visibility",
      isOrdersVisible &&
        clustersEnabled
        ? "visible"
        : "none"
    );

    map.setLayoutProperty(
      ordersClusterCountLayerId,
      "visibility",
      isOrdersVisible &&
        clustersEnabled
        ? "visible"
        : "none"
    );
  }, [
    vehicles,
    isOrdersVisible,
    clustersEnabled,
    isMapLoaded,
    styleVersion,
  ]);

  // Обновляем состояние кластеров после переключения.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapLoaded) {
      return;
    }

    const source = map.getSource(
      ordersSourceId
    ) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (!source) {
      return;
    }

    const data = {
      type: "FeatureCollection" as const,
      features: vehicles.map(
        (vehicle) => ({
          type: "Feature" as const,
          properties: {
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [
              vehicle.telemetry.lng,
              vehicle.telemetry.lat,
            ],
          },
        })
      ),
    };

    source.setData(data);

    if (
      map.getLayer(
        ordersLayerId
      )
    ) {
      map.setLayoutProperty(
        ordersLayerId,
        "visibility",
        isOrdersVisible
          ? "visible"
          : "none"
      );
    }

    if (
      map.getLayer(
        ordersClusterLayerId
      )
    ) {
      map.setLayoutProperty(
        ordersClusterLayerId,
        "visibility",
        isOrdersVisible &&
          clustersEnabled
          ? "visible"
          : "none"
      );
    }

    if (
      map.getLayer(
        ordersClusterCountLayerId
      )
    ) {
      map.setLayoutProperty(
        ordersClusterCountLayerId,
        "visibility",
        isOrdersVisible &&
          clustersEnabled
          ? "visible"
          : "none"
      );
    }
  }, [
    vehicles,
    clustersEnabled,
    isOrdersVisible,
    isMapLoaded,
    styleVersion,
  ]);

  // Tooltip для жёлтых точек.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapLoaded) {
      return;
    }

    const handleMouseEnter = (
      event: mapboxgl.MapLayerMouseEvent
    ) => {
      const feature =
        event.features?.[0];

      if (!feature) {
        return;
      }

      const vehicleId = String(
        feature.properties?.vehicleId ??
          ""
      );

      const vehicle =
        vehiclesRef.current.find(
          (item) =>
            item.id === vehicleId
        );

      if (!vehicle) {
        return;
      }

      const order =
        getVehicleOrder(
          vehicle,
          ordersRef.current
        );

      orderPopupRef.current?.remove();

      const popupContent =
        createOrderPopupContent(
          vehicle,
          order
        );

      orderPopupRef.current =
        new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          maxWidth: "320px",
          className:
            styles.orderPopup,
        })
          .setLngLat([
            vehicle.telemetry.lng,
            vehicle.telemetry.lat,
          ])
          .setDOMContent(
            popupContent
          )
          .addTo(map);

      setMapPointerCursor(map);
    };

    const handleMouseLeave = () => {
      resetMapCursor(map);

      orderPopupRef.current?.remove();
      orderPopupRef.current = null;
    };

    map.on(
      "mouseenter",
      ordersLayerId,
      handleMouseEnter
    );

    map.on(
      "mouseleave",
      ordersLayerId,
      handleMouseLeave
    );

    return () => {
      map.off(
        "mouseenter",
        ordersLayerId,
        handleMouseEnter
      );

      map.off(
        "mouseleave",
        ordersLayerId,
        handleMouseLeave
      );

      resetMapCursor(map);

      orderPopupRef.current?.remove();
      orderPopupRef.current = null;
    };
  }, [
    isMapLoaded,
    styleVersion,
  ]);

  // Полный маршрут выбранного автомобиля.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapLoaded) {
      return;
    }

    if (!selectedVehicle) {
      clearSelectedRoute(map);

      focusedVehicleIdRef.current =
        null;

      return;
    }

    // Завершённый маршрут больше не показываем
    // на оперативной карте.
    if (
      selectedVehicle.route
        ?.deliveryCompleted === true
    ) {
      clearSelectedRoute(map);

      focusedVehicleIdRef.current =
        selectedVehicle.id;

      return;
    }

    const routePath =
      selectedVehicle.route?.path ?? [];

    if (routePath.length < 2) {
      clearSelectedRoute(map);
      return;
    }

    const fullRouteData =
      toLineFeature(routePath);

    const fullRouteSource =
      map.getSource(
        routeSourceId
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (fullRouteSource) {
      fullRouteSource.setData(
        fullRouteData
      );
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

    startMarkerRef.current?.remove();
    finishMarkerRef.current?.remove();

    if (selectedVehicle.route?.start) {
      startMarkerRef.current =
        new mapboxgl.Marker(
          createRoutePointElement(
            "start",
            selectedVehicle.type
          )
        )
          .setLngLat(
            selectedVehicle.route.start
          )
          .addTo(map);
    }

    if (selectedVehicle.route?.finish) {
      finishMarkerRef.current =
        new mapboxgl.Marker(
          createRoutePointElement(
            "finish",
            selectedVehicle.type
          )
        )
          .setLngLat(
            selectedVehicle.route.finish
          )
          .addTo(map);
    }

    const shouldFocusSelectedVehicle =
      focusedVehicleIdRef.current !==
      selectedVehicle.id;

    focusedVehicleIdRef.current =
      selectedVehicle.id;

    if (shouldFocusSelectedVehicle) {
      map.easeTo({
        center: [
          selectedVehicle.telemetry.lng,
          selectedVehicle.telemetry.lat,
        ],
        zoom: 13,
        duration: 700,
      });
    }
  }, [
    selectedVehicleId,
    selectedVehicle?.route?.path,
    selectedVehicle?.route?.start,
    selectedVehicle?.route?.finish,
    selectedVehicle?.route?.deliveryCompleted,
    isMapLoaded,
    styleVersion,
  ]);

  // Прогресс выбранного маршрута.
  useEffect(() => {
    const map = mapRef.current;

    if (
      !map ||
      !isMapLoaded ||
      !selectedVehicle
    ) {
      return;
    }

    // Завершённый маршрут больше не является
    // частью оперативного Tracking.
    if (
      selectedVehicle.route
        ?.deliveryCompleted === true
    ) {
      if (
        map.getLayer(
          completedRouteLayerId
        )
      ) {
        map.removeLayer(
          completedRouteLayerId
        );
      }

      if (
        map.getSource(
          completedRouteSourceId
        )
      ) {
        map.removeSource(
          completedRouteSourceId
        );
      }

      return;
    }

    const completedPath =
      selectedVehicle.route
        ?.completedPath ?? [];

    if (completedPath.length < 2) {
      if (
        map.getLayer(
          completedRouteLayerId
        )
      ) {
        map.removeLayer(
          completedRouteLayerId
        );
      }

      if (
        map.getSource(
          completedRouteSourceId
        )
      ) {
        map.removeSource(
          completedRouteSourceId
        );
      }

      return;
    }

    const completedRouteData =
      toLineFeature(completedPath);

    const completedRouteSource =
      map.getSource(
        completedRouteSourceId
      ) as
        | mapboxgl.GeoJSONSource
        | undefined;

    if (completedRouteSource) {
      completedRouteSource.setData(
        completedRouteData
      );

      return;
    }

    map.addSource(
      completedRouteSourceId,
      {
        type: "geojson",
        data: completedRouteData,
      }
    );

    map.addLayer({
      id: completedRouteLayerId,
      type: "line",
      source:
        completedRouteSourceId,
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-width": 5,
        "line-color": "#2563eb",
      },
    });
  }, [
    selectedVehicle,
    isMapLoaded,
    styleVersion,
  ]);

  return (
    <Card className={styles.map}>
      <div
        ref={mapContainerRef}
        className={styles.mapContainer}
      />
    </Card>
  );
};