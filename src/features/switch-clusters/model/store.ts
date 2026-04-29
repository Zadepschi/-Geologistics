import { create } from "zustand";

interface ClustersStore {
  isEnabled: boolean;
  toggleClusters: () => void;
  setClusters: (value: boolean) => void;
}

export const useClustersStore = create<ClustersStore>((set) => ({
  isEnabled: false, // лучше false по умолчанию (как в UI)

  toggleClusters: () =>
    set((state) => ({
      isEnabled: !state.isEnabled,
    })),

  setClusters: (value) =>
    set(() => ({
      isEnabled: value,
    })),
}));