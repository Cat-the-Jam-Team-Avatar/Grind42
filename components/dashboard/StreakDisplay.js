"use client";

import { getMultiplier, streakDayLabel } from "@/lib/streak";

export default function StreakDisplay({ streak }) {
  const multiplier = getMultiplier(streak);
  const label = streakDayLabel(streak);

  const bars = Array.from({ length: 7 }, (_, i) => ({
    day: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][i],
    active: i < streak,
  }));

  return (
    <div className="nes-container is-dark with-title">
      <p className="title nes-text text-xs">Seri</p>
      <div className="flex gap-1 mb-2">
        {bars.map((b) => (
          <div
            key={b.day}
            className={`flex flex-col items-center gap-1`}
          >
            <div
              className={`w-4 h-4 border-2 ${
                b.active ? "bg-yellow-400 border-yellow-400" : "bg-transparent border-gray-600"
              }`}
            />
            <span className="nes-text text-[6px]">{b.day}</span>
          </div>
        ))}
      </div>
      <p className="nes-text is-warning text-xs">{label} · x{multiplier.toFixed(1)}</p>
    </div>
  );
}
