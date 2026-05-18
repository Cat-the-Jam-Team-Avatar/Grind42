"use client";

import { useState, useEffect, useRef } from "react";

export default function SoundToggle({ size = "md" }) {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    // Component mount olduğunda audio objesini oluştur
    audioRef.current = new Audio("/cluster/sound/ofice_sound.wav");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    // Önceki tercihi oku
    const saved = localStorage.getItem("g42_bg_muted");
    if (saved !== null) {
      const parsedMuted = saved === "true";
      setIsMuted(parsedMuted);
      
      // Eğer daha önceden sessizde değilse, çalmayı dene.
      // Not: Tarayıcı etkileşim olmadığı için bunu bloke edebilir.
      if (!parsedMuted) {
        audioRef.current.play().catch(() => {
          // Engellenirse state'i sessize geri çek
          setIsMuted(true);
          localStorage.setItem("g42_bg_muted", "true");
        });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem("g42_bg_muted", newMutedState.toString());

    // Ses çalma/durdurma işlemini DOĞRUDAN onClick event loop'u içinde yap
    // useEffect içine bırakırsak tarayıcılar (özellikle Safari) güvenlik nedeniyle engelleyebilir.
    if (newMutedState) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Ses oynatılamadı:", err);
        setIsMuted(true);
      });
    }
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
