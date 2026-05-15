import { create } from "zustand";

export const useInventoryStore = create((set) => ({
  ownedIds: [],

  setInventory: (ids) => set({ ownedIds: ids }),

  addItem: (id) =>
    set((state) => ({
      ownedIds: state.ownedIds.includes(id) ? state.ownedIds : [...state.ownedIds, id],
    })),
}));
