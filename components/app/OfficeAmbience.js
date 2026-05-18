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

    const tryPlay = () => {
      if (!audioRef.current || startedRef.current) return;
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

    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return null;
}
