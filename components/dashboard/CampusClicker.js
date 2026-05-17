"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import PixelSprite, { CoinIcon } from "@/components/ui/PixelSprite";

/* ── Floating Coin Text ──────────────────────────────────────────────────── */

function FloatingText({ id, x, y, text, color }) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 1, y: 0, scale: 0.8 }}
      animate={{ opacity: 0, y: -80, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="absolute pointer-events-none z-[20] flex items-center gap-1"
      style={{
        left: x,
        top: y,
        color: color ?? "var(--g42-coin)",
        fontFamily: "var(--font-silkscreen), monospace",
        fontSize: "18px",
        fontWeight: "bold",
        textShadow: "2px 2px 0 var(--g42-line), -1px -1px 0 var(--g42-line)",
        filter: "drop-shadow(0 0 6px var(--g42-coin))",
      }}
    >
      +{text}
    </motion.div>
  );
}

/* ── Particle Burst ──────────────────────────────────────────────────────── */

const PARTICLE_COLORS = ["#ffc83a", "#fbb478", "#e85d2f", "#77dd77", "#75d0c1", "#fff8c0"];

function seededParticleValue(id, index, salt) {
  const value = Math.sin((id + 1) * (index + 1) * (salt + 3.17)) * 10000;
  return value - Math.floor(value);
}

function ParticleBurst({ id, x, y }) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const colorIndex = Math.floor(
      seededParticleValue(id, i, 3) * PARTICLE_COLORS.length,
    );

    return {
      angle: (i / 8) * Math.PI * 2 + (seededParticleValue(id, i, 0) - 0.5) * 0.5,
      color: PARTICLE_COLORS[colorIndex],
      distance: 30 + seededParticleValue(id, i, 1) * 50,
      size: 3 + seededParticleValue(id, i, 2) * 5,
    };
  });

  return (
    <>
      {particles.map((p, i) => (
        <motion.div
          key={`${id}-p-${i}`}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 0,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute pointer-events-none z-[19]"
          style={{
            left: x,
            top: y,
            width: p.size,
            height: p.size,
            background: p.color,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </>
  );
}

/* ── Combo Badge ─────────────────────────────────────────────────────────── */

function ComboBadge({ combo, multiplier, decayProgress }) {
  const comboColor =
    multiplier >= 2 ? "var(--g42-danger)" :
    multiplier >= 1.5 ? "var(--g42-coin)" :
    "var(--g42-good)";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-1"
    >
      {/* Combo count + multiplier */}
      <div className="flex items-center gap-2">
        <motion.span
          key={combo}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="font-[var(--font-silkscreen),monospace] text-[24px] leading-none"
          style={{ color: comboColor, textShadow: `0 0 12px ${comboColor}` }}
        >
          {combo}x
        </motion.span>
        <span className="font-[var(--font-silkscreen),monospace] text-[11px] text-g42-muted uppercase tracking-wider">
          Combo
        </span>
        {multiplier > 1 && (
          <motion.span
            key={multiplier}
            initial={{ scale: 1.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 12 }}
            className="font-[var(--font-silkscreen),monospace] text-[13px] px-2 py-0.5 border-[2px]"
            style={{
              color: comboColor,
              borderColor: comboColor,
              background: "var(--g42-paper)",
              boxShadow: `0 0 8px ${comboColor}40`,
            }}
          >
            ×{multiplier.toFixed(1)}
          </motion.span>
        )}
      </div>

      {/* Decay progress bar */}
      <div className="w-[120px] h-[6px] bg-g42-paper-2 border-[2px] border-g42-line overflow-hidden">
        <motion.div
          className="h-full"
          style={{ background: comboColor }}
          initial={{ width: "100%" }}
          animate={{ width: `${decayProgress * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

/* ── Lock Overlay ────────────────────────────────────────────────────────── */

function LockOverlay({ unlocksAt }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    function update() {
      const diff = Math.max(0, unlocksAt - Date.now());
      if (diff <= 0) { setRemaining(""); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [unlocksAt]);

  return (
    <div className="g42-clicker-locked absolute inset-0 z-[25] flex flex-col items-center justify-center gap-3">
      <span className="text-[36px]">🔒</span>
      <p className="m-0 font-[var(--font-silkscreen),monospace] text-[12px] text-g42-danger text-center">
        Tıklama limiti doldu!
      </p>
      {remaining && (
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[18px] text-g42-ink tabular-nums">
          {remaining}
        </p>
      )}
    </div>
  );
}

/* ── Main CampusClicker ──────────────────────────────────────────────────── */

export default function CampusClicker() {
  const clickCampus = usePlayerStore((s) => s.clickCampus);
  const comboCount = usePlayerStore((s) => s.combo_count);
  const comboMult = usePlayerStore((s) => s.combo_multiplier);
  const clickLocked = usePlayerStore((s) => s.click_locked_until);
  const balance = usePlayerStore((s) => s.balance);
  const sessionClicks = usePlayerStore((s) => s.session_clicks);

  const [floatingTexts, setFloatingTexts] = useState([]);
  const [particles, setParticles] = useState([]);
  const [isShaking, setIsShaking] = useState(false);
  const [decayProgress, setDecayProgress] = useState(0);
  const [clock, setClock] = useState(null);

  const containerRef = useRef(null);
  const decayTimerRef = useRef(null);
  const textIdRef = useRef(0);

  // Combo decay progress tracking
  useEffect(() => {
    if (comboCount === 0) {
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
      return;
    }

    const frame = requestAnimationFrame(() => {
      const decayMs = 1500 + 100; // Base decay (level 1 approximation)
      const startTime = Date.now();

      setDecayProgress(1);
      decayTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, 1 - elapsed / decayMs);
        setDecayProgress(progress);
        if (progress <= 0) clearInterval(decayTimerRef.current);
      }, 50);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    };
  }, [comboCount]);

  useEffect(() => {
    const tick = () => setClock(Date.now());
    const timeout = setTimeout(tick, 0);
    const interval = clickLocked ? setInterval(tick, 1000) : null;

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [clickLocked]);

  const isLocked = clickLocked !== null && (clock === null || clock < clickLocked);

  const handleClick = useCallback(
    (e) => {
      if (isLocked) return;

      const rect = containerRef.current?.getBoundingClientRect();
      const x = e.clientX - (rect?.left ?? 0);
      const y = e.clientY - (rect?.top ?? 0);

      const result = clickCampus();
      if (!result || result.frozen || result.locked) return;

      const id = ++textIdRef.current;

      // Floating text
      setFloatingTexts((prev) => [
        ...prev.slice(-12),
        {
          id,
          x: x + (Math.random() - 0.5) * 30,
          y: y - 10,
          text: result.earned.toFixed(1),
          color:
            result.multiplier >= 2 ? "var(--g42-danger)" :
            result.multiplier >= 1.5 ? "var(--g42-coin)" :
            undefined,
        },
      ]);

      // Particles
      setParticles((prev) => [...prev.slice(-6), { id, x, y }]);

      // Screen shake on high combo
      if (result.combo >= 75 && !isShaking) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }

      // Clean up old effects
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((t) => t.id !== id));
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 1000);
    },
    [clickCampus, isLocked, isShaking]
  );

  return (
    <div
      className={`relative flex flex-col items-center gap-4 py-6 ${isShaking ? "g42-shake" : ""}`}
      ref={containerRef}
    >
      {/* Balance display */}
      <div className="flex items-center gap-2">
        <CoinIcon size={20} />
        <motion.span
          key={Math.floor(balance)}
          initial={{ scale: 1.15, color: "var(--g42-coin)" }}
          animate={{ scale: 1, color: "var(--g42-ink)" }}
          transition={{ duration: 0.3 }}
          className="font-[var(--font-silkscreen),monospace] text-[28px] leading-none tabular-nums"
        >
          {Math.floor(balance).toLocaleString("tr-TR")}
        </motion.span>
        <span className="font-[var(--font-silkscreen),monospace] text-[11px] text-g42-muted">
          LC
        </span>
      </div>

      {/* Combo badge */}
      <AnimatePresence>
        {comboCount > 0 && (
          <ComboBadge
            combo={comboCount}
            multiplier={comboMult}
            decayProgress={decayProgress}
          />
        )}
      </AnimatePresence>

      {/* Clickable PC */}
      <div className="relative">
        <motion.button
          onClick={handleClick}
          disabled={isLocked}
          whileTap={isLocked ? {} : { scale: 0.92 }}
          className={`
            relative z-[10] cursor-pointer border-none bg-transparent p-4
            transition-all duration-150
            ${isLocked ? "grayscale opacity-50 cursor-not-allowed" : ""}
          `}
          aria-label="Kampüs bilgisayarına tıkla, coin kazan"
        >
          {/* Glow ring */}
          <div className="g42-glow-pulse absolute inset-[-12px] rounded-lg z-[-1]" />

          <PixelSprite name="campus_pc" scale={5} />
        </motion.button>

        {/* Lock overlay */}
        {isLocked && <LockOverlay unlocksAt={clickLocked} />}
      </div>

      {/* Click hint */}
      <p className="m-0 font-[var(--font-silkscreen),monospace] text-[10px] text-g42-muted uppercase tracking-wider">
        {isLocked
          ? "Bekleniyor..."
          : `Tıkla & Kazan · ${sessionClicks} / 1000`}
      </p>

      {/* Floating effects layer */}
      <AnimatePresence>
        {floatingTexts.map((ft) => (
          <FloatingText key={ft.id} {...ft} />
        ))}
      </AnimatePresence>
      {particles.map((p) => (
        <ParticleBurst key={p.id} {...p} />
      ))}
    </div>
  );
}
