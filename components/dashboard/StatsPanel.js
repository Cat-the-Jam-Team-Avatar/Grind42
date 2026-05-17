"use client";

import { calcPlayerLevel } from "@/lib/economy";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatHours(hours) {
  if (!Number.isFinite(hours)) return "–";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}s ${m.toString().padStart(2, "0")}dk`;
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard({ label, value, accent = "text-g42-ink", icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 min-w-[80px] border-[3px] border-g42-line bg-g42-paper-2 h-full">
      <span className="font-[var(--font-silkscreen),monospace] text-[10px] text-g42-muted uppercase tracking-wider leading-none">
        {label}
      </span>
      <span className={`flex items-center gap-1 font-[var(--font-silkscreen),monospace] text-[18px] font-bold leading-none ${accent}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}



function KeyStats({ isOnline, location, todayHours, yesterdayHours, level }) {
  return (
    <div className="grid grid-cols-2 gap-3 h-full">
      <div className="flex flex-col items-center justify-center gap-2 px-3 py-6 border-[3px] border-g42-line bg-g42-paper-2 h-full">
        <span className="font-[var(--font-silkscreen),monospace] text-[10px] text-g42-muted uppercase tracking-wider leading-none">
          Cluster
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isOnline ? "bg-g42-good shadow-[0_0_6px_var(--g42-good)]" : "bg-g42-muted"
            }`}
          />
          <span
            className={`font-[var(--font-silkscreen),monospace] text-[15px] font-bold leading-none ${
              isOnline ? "text-g42-good" : "text-g42-muted"
            }`}
          >
            {isOnline ? location : "Offline"}
          </span>
        </div>
      </div>
      <StatCard
        label="Bugün"
        value={formatHours(todayHours)}
        accent="text-g42-accent-2"
      />
      <StatCard
        label="Dün"
        value={formatHours(yesterdayHours)}
        accent="text-g42-accent-2"
      />
      <StatCard
        label="Seviye"
        value={`Lv ${level}`}
        accent="text-g42-accent-2"
      />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function StatsPanel({ player, yesterdayLogtime, todayLogtime }) {
  if (!player) return null;

  const yesterdayHours = Number.isFinite(yesterdayLogtime?.hours)
    ? yesterdayLogtime.hours
    : Number(player.last_logtime_hours);

  const todayHours = Number.isFinite(todayLogtime?.hours) ? todayLogtime.hours : 0;
  const isOnline = !!player.intra_location;
  const location = player.intra_location;

  const totalXp = player.xp ?? 0;
  const playerLevel = calcPlayerLevel(totalXp);

  return (
    <div className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] flex flex-col h-full">
      <p className="title">İstatistikler</p>
      <div className="flex flex-col flex-1 justify-center py-2">
        {/* Top: Key Stats */}
        <KeyStats
          isOnline={isOnline}
          location={location}
          todayHours={todayHours}
          yesterdayHours={yesterdayHours}
          level={playerLevel}
        />
      </div>
    </div>
  );
}
