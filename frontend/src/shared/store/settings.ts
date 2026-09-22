import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
export type DistanceUnit = "km" | "mi";

interface SettingsState {
  deliveryUpdates: boolean;
  vehicleAlerts: boolean;
  routeAlerts: boolean;
  theme: Theme;
  distanceUnit: DistanceUnit;
  setDeliveryUpdates: (value: boolean) => void;
  setVehicleAlerts: (value: boolean) => void;
  setRouteAlerts: (value: boolean) => void;
  setTheme: (theme: Theme) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  deliveryUpdates: true,
  vehicleAlerts: true,
  routeAlerts: false,
  theme: "light",
  distanceUnit: "km",
  setDeliveryUpdates: (value) => set({ deliveryUpdates: value }),
  setVehicleAlerts: (value) => set({ vehicleAlerts: value }),
  setRouteAlerts: (value) => set({ routeAlerts: value }),
  setTheme: (theme) => set({ theme }),
  setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
}));