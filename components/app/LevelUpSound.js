"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { calcPlayerLevel } from "@/lib/economy";

export default function LevelUpSound() {
  const playerId = usePlayerStore((s) => s.id);
  const xp = usePlayerStore((s) => s.xp);
  const audioRef = useRef(null);
  const lastLevelRef = useRef(null);
  const readyRef = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio("/cluster/sound/click_level.wav");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 0.45;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!playerId) return;
    lastLevelRef.current = calcPlayerLevel(xp ?? 0);
    readyRef.current = true;
  }, [playerId]);

  useEffect(() => {
    if (!readyRef.current) return;
    const currentLevel = calcPlayerLevel(xp ?? 0);
    if (lastLevelRef.current !== null && currentLevel > lastLevelRef.current) {
      if (audioRef.current && localStorage.getItem("g42_bg_muted") !== "true") {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    }

    lastLevelRef.current = currentLevel;
  }, [xp]);

  return null;
}
