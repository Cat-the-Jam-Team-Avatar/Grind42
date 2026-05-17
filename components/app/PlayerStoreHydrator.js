"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Invisible client component that hydrates the Zustand player store
 * with server-fetched player data. Place once in the dashboard layout
 * or page so all child client components share the same store state.
 */
export default function PlayerStoreHydrator({ player }) {
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (player && !hasHydrated.current) {
      hasHydrated.current = true;
      usePlayerStore.getState().setPlayer(player);
    }
  }, [player]);

  return null;
}
