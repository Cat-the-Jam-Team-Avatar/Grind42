"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Invisible client component that hydrates the Zustand player store
 * with server-fetched player data. Place once in the dashboard layout
 * or page so all child client components share the same store state.
 */
export default function PlayerStoreHydrator({ player }) {
  useEffect(() => {
    if (player) {
      usePlayerStore.getState().setPlayer(player);
    }
  }, [player]);

  return null;
}
