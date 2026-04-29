import { create } from "zustand";

interface OrdersLayerStore {
  isVisible: boolean;
  toggle: () => void;
}

export const useOrdersLayerStore = create<OrdersLayerStore>((set) => ({
  isVisible: true,
  toggle: () =>
    set((state) => ({
      isVisible: !state.isVisible,
    })),
}));