"use client";

import { getMultiplier, streakDayLabel, STREAK_CYCLE_LENGTH } from "@/lib/streak";
import PixelSprite from "@/components/ui/PixelSprite";

/* ── Constants ───────────────────────────────────────────────────────────── */

const STREAK_DAYS = Array.from({ length: STREAK_CYCLE_LENGTH }, (_, i) => `GÜN ${i + 1}`);
const MULTIPLIERS = [1.0, 1.3, 1.4, 1.5, 1.6, 1.7, 2.0];

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StreakHeader({ streak, label, multiplier }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-3 [&_p]:m-0">
      <div className="flex items-center gap-3">
        <PixelSprite name="flame" scale={2.4} />
        <div>
          <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[10px] uppercase tracking-wider">
            Kampüs Serisi
          </p>
          <p className="font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[22px] leading-tight">
            {streak} gün
          </p>
        </div>
      </div>
      <span className="inline-flex items-center font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-3 py-[6px] text-[12px] whitespace-nowrap">
        {label} x{multiplier.toFixed(1)}
      </span>
    </div>
  );
}

function StreakBar({ day, multiplier, active, current }) {
  const stateClasses = current
    ? "-translate-y-[4px] bg-g42-coin text-g42-coin-ink shadow-[0_5px_0_var(--g42-line)] scale-[1.04]"
    : active
      ? "bg-g42-bg-2 text-g42-good"
      : "bg-g42-paper-2 text-g42-muted";

  return (
    <div
      className={`relative min-w-0 text-center py-3 px-1 border-[3px] border-g42-line transition-transform ${stateClasses}`}
    >
      <span className="block font-[var(--font-silkscreen),monospace] text-[11px] leading-none">
        {day}
      </span>
      <span className="block font-[var(--font-silkscreen),monospace] mt-1.5 text-[17px] leading-none font-bold">
        {multiplier.toFixed(1)}x
      </span>
      {active && (
        <span className="block mt-1 text-[10px] leading-none">✓</span>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function StreakDisplay({ streak }) {
  const multiplier = getMultiplier(streak);
  const label = streakDayLabel(streak);
  // streak 0 means no active streak, currentIndex maps to which bar is "current"
  const currentIndex = streak > 0 ? Math.min(streak, STREAK_CYCLE_LENGTH) - 1 : -1;

  const bars = STREAK_DAYS.map((day, i) => ({
    day,
    multiplier: MULTIPLIERS[i],
    active: i < currentIndex,
    current: i === currentIndex,
  }));

  return (
    <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
      <p className="title">Seri</p>
      <StreakHeader streak={streak} label={label} multiplier={multiplier} />
      <div className="grid max-w-full grid-cols-7 gap-[6px] max-[560px]:grid-cols-7">
        {bars.map((b) => (
          <StreakBar key={b.day} {...b} />
        ))}
      </div>
    </div>
  );
}
