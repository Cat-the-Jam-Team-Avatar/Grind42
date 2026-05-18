"use client";

import { useState, useEffect, useRef } from "react";

export default function SoundToggle({ size = "md" }) {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("g42_bg_muted");
    if (saved !== null) {
      setIsMuted(saved === "true");
    }
    
    // Create audio instance
    audioRef.current = new Audio("/cluster/sound/ofice_sound.wav");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.pause();
    } else {
      // Browsers might block autoplay if no interaction has happened yet
      audioRef.current.play().catch(() => {
        setIsMuted(true);
      });
    }
    localStorage.setItem("g42_bg_muted", isMuted.toString());
  }, [isMuted]);

  const sizeClass =
    size === "sm" ? "w-8 h-8 text-[13px]" : "w-10 h-10 text-[15px]";

  return (
    <button
      type="button"
      className={`${sizeClass} shrink-0 flex items-center justify-center border-[3px] border-g42-line bg-g42-paper text-g42-ink shadow-[3px_3px_0_var(--g42-line)] hover:bg-g42-paper-2 active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-[box-shadow,transform] duration-75 cursor-pointer`}
      aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
      title={isMuted ? "Sesi aç" : "Sesi kapat"}
      onClick={() => setIsMuted(!isMuted)}
      suppressHydrationWarning
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {isMuted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}
