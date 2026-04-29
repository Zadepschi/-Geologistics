import { create } from "zustand";

interface SelectOrderStore {
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string) => void;
}

export const useSelectOrderStore = create<SelectOrderStore>((set) => ({
  selectedOrderId: "ORD-4003",
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
}));