import { create } from "zustand";

type MapTheme = "dark" | "outdoors";

interface MapThemeStore {
  theme: MapTheme;
  toggleTheme: () => void;
}

export const useMapThemeStore = create<MapThemeStore>((set) => ({
  theme: "dark",
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "outdoors" : "dark",
    })),
}));