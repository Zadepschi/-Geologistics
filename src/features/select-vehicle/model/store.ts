import { create } from "zustand";

interface SelectVehicleStore {
  selectedVehicleId: string | null;
  setSelectedVehicleId: (id: string) => void;
}

export const useSelectVehicleStore = create<SelectVehicleStore>((set) => ({
  selectedVehicleId: null,
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
}));