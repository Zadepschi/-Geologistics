import { create } from "zustand";

export type Theme = "light" | "dark" | "system";
export type DistanceUnit = "km" | "mi";
export type Language = "English" | "Romanian" | "Russian";

interface SettingsState {
  deliveryUpdates: boolean;
  vehicleAlerts: boolean;
  routeAlerts: boolean;

  theme: Theme;
  distanceUnit: DistanceUnit;
  language: Language;

  setDeliveryUpdates: (value: boolean) => void;
  setVehicleAlerts: (value: boolean) => void;
  setRouteAlerts: (value: boolean) => void;

  setTheme: (theme: Theme) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  deliveryUpdates: true,
  vehicleAlerts: true,
  routeAlerts: false,

  theme: "light",
  distanceUnit: "km",
  language: "English",

  setDeliveryUpdates: (value) => set({ deliveryUpdates: value }),
  setVehicleAlerts: (value) => set({ vehicleAlerts: value }),
  setRouteAlerts: (value) => set({ routeAlerts: value }),

  setTheme: (theme) => set({ theme }),
  setDistanceUnit: (distanceUnit) => set({ distanceUnit }),
  setLanguage: (language) => set({ language }),
}));