"use client";

import { useState, useEffect } from "react";

export default function SoundToggle({ size = "md" }) {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("g42_bg_muted");
    if (saved !== null) {
      setIsMuted(saved === "true");
    }

    const handleEvent = (e) => setIsMuted(e.detail);
    window.addEventListener("g42_mute_toggled", handleEvent);
    return () => window.removeEventListener("g42_mute_toggled", handleEvent);
  }, []);

  const toggleSound = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("g42_bg_muted", newMutedState.toString());
    window.dispatchEvent(new CustomEvent("g42_mute_toggled", { detail: newMutedState }));
  };

  const sizeClass =
    size === "sm" ? "w-8 h-8 text-[13px]" : "w-10 h-10 text-[15px]";

  return (
    <button
      type="button"
      className={`${sizeClass} shrink-0 flex items-center justify-center border-[3px] border-g42-line bg-g42-paper text-g42-ink shadow-[3px_3px_0_var(--g42-line)] hover:bg-g42-paper-2 active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-[box-shadow,transform] duration-75 cursor-pointer`}
      aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
      title={isMuted ? "Sesi aç" : "Sesi kapat"}
      onClick={toggleSound}
      suppressHydrationWarning
    >
      <span aria-hidden="true" suppressHydrationWarning>
        {isMuted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}
