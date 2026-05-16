"use client";

import { getMultiplier, streakDayLabel } from "@/lib/streak";
import PixelSprite from "@/components/ui/PixelSprite";

export default function StreakDisplay({ streak }) {
  const multiplier = getMultiplier(streak);
  const label = streakDayLabel(streak);
  const currentIndex = Math.min(streak, 6);

  const bars = Array.from({ length: 7 }, (_, i) => ({
    day: ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"][i],
    multiplier: [1.0, 1.3, 1.4, 1.5, 1.6, 1.7, 2.0][i],
    active: i < currentIndex,
    current: i === currentIndex,
  }));

  return (
    <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
      <p className="title">Seri</p>
      <div className="flex items-center justify-between gap-4 mb-[10px] [&_p]:m-0">
        <div className="flex items-center gap-3">
          <PixelSprite name="flame" scale={2} />
          <div>
            <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">Haftalık Seri</p>
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px]">{streak} gün</p>
          </div>
        </div>
        <span className="inline-flex items-center m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-2 py-[6px] text-[11px]">{label} x{multiplier.toFixed(1)}</span>
      </div>
      <div className="grid max-w-full grid-cols-7 gap-[5px] max-[560px]:grid-cols-4">
        {bars.map((b) => (
          <div
            key={b.day}
            className={`relative min-w-0 text-center py-2 px-1 border-[3px] border-g42-line ${
              b.current
                ? "-translate-y-[3px] bg-g42-coin text-g42-coin-ink shadow-[0_5px_0_var(--g42-line)]"
                : b.active
                ? "bg-g42-bg-2 text-g42-good"
                : "bg-g42-paper-2 text-g42-muted"
            }`}
          >
            <span className="block font-[var(--font-silkscreen),monospace] text-[10px]">{b.day}</span>
            <span className="block font-[var(--font-silkscreen),monospace] mt-0.5 text-[15px]">{b.multiplier.toFixed(1)}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
