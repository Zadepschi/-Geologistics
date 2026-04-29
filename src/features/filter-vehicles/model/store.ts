import { create } from "zustand";
import type { VehicleFilterState } from "./types";

interface VehicleFilterStore extends VehicleFilterState {
  setStatus: (status: VehicleFilterState["status"]) => void;
  setSearch: (search: string) => void;
}

export const useVehicleFilterStore = create<VehicleFilterStore>((set) => ({
  status: "all",
  search: "",
  setStatus: (status) => set({ status }),
  setSearch: (search) => set({ search }),
}));