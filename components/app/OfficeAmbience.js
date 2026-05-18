"use client";

import { useEffect, useRef } from "react";

export default function OfficeAmbience() {
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/cluster/sound/ofice_sound.wav");
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = "auto";
    audioRef.current = audio;

    const isMuted = () => localStorage.getItem("g42_bg_muted") === "true";

    const tryPlay = () => {
      if (!audioRef.current || startedRef.current || isMuted()) return;
      const result = audioRef.current.play();
      if (result && typeof result.then === "function") {
        result
          .then(() => {
            startedRef.current = true;
          })
          .catch(() => {});
      } else {
        startedRef.current = true;
      }
    };

    tryPlay();

    const onFirstInteraction = () => {
      if (startedRef.current) return;
      tryPlay();
    };

    window.addEventListener("pointerdown", onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });

    const handleToggle = (e) => {
      const muted = e.detail;
      if (muted) {
        audioRef.current?.pause();
      } else {
        startedRef.current = false;
        tryPlay();
      }
    };
    window.addEventListener("g42_mute_toggled", handleToggle);

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("g42_mute_toggled", handleToggle);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null;
}
