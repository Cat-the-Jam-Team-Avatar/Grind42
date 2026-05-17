"use client";

import ProfileAvatar from "@/components/ProfileAvatar";
import { CoinIcon } from "@/components/ui/PixelSprite";
import { calcPlayerLevel, xpProgressInLevel, PC_MAX_LEVEL } from "@/lib/economy";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatHours(hours) {
  if (!Number.isFinite(hours)) return "–";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}s ${m.toString().padStart(2, "0")}dk`;
}

function formatCoins(value) {
  return Number(value ?? 0).toLocaleString("tr-TR");
}

function formatXp(value) {
  return Number(value ?? 0).toLocaleString("tr-TR");
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function StatCard({ label, value, accent = "text-g42-ink", icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[80px] border-[3px] border-g42-line bg-g42-paper-2">
      <span className="font-[var(--font-silkscreen),monospace] text-[8px] text-g42-muted uppercase tracking-wider leading-none">
        {label}
      </span>
      <span className={`flex items-center gap-1 font-[var(--font-silkscreen),monospace] text-[14px] font-bold leading-none ${accent}`}>
        {icon}
        {value}
      </span>
    </div>
  );
}

function XpBar({ current, needed, level }) {
  const pct = needed > 0 ? Math.min((current / needed) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted whitespace-nowrap shrink-0">
        Lv {level}
      </span>
      <div className="flex-1 h-[14px] border-[3px] border-g42-line bg-g42-paper-2 relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-g42-accent-2 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center font-[var(--font-silkscreen),monospace] text-[7px] text-g42-ink leading-none z-[1]">
          {formatXp(current)} / {formatXp(needed)}
        </span>
      </div>
      <span className="font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted whitespace-nowrap shrink-0">
        Lv {level + 1}
      </span>
    </div>
  );
}

function ProfileIdentity({ displayName, login, campusName, avatarUrl }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <ProfileAvatar label={displayName} size={56} src={avatarUrl} />
      <div>
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[15px] text-g42-ink leading-tight">
          {displayName}
        </p>
        <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted mt-[6px]">
          {login} · {campusName}
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function StatsPanel({ player, yesterdayLogtime }) {
  if (!player) return null;

  const displayName = player.display_name ?? player.intra_login;
  const yesterdayHours = Number.isFinite(yesterdayLogtime?.hours)
    ? yesterdayLogtime.hours
    : Number(player.last_logtime_hours);

  const cursusText =
    player.cursus_level != null
      ? `Lv ${Number(player.cursus_level).toFixed(2)}`
      : "–";

  // New game logic: XP & Level
  const totalXp = player.xp ?? 0;
  const playerLevel = calcPlayerLevel(totalXp);
  const xpProgress = xpProgressInLevel(totalXp);
  const pcLevel = player.pc_level ?? 0;

  return (
    <div className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] flex flex-col">
      <p className="title">Profil</p>
      <div className="flex flex-col gap-4 flex-1 justify-between">
        {/* Top: Avatar + Name */}
        <ProfileIdentity
          displayName={displayName}
          login={player.intra_login}
          campusName={player.campus_name ?? "42"}
          avatarUrl={player.profile_image_url}
        />

        {/* XP Progress Bar */}
        <XpBar
          current={xpProgress.current}
          needed={xpProgress.needed}
          level={playerLevel}
        />

        {/* Bottom: Stat cards grid */}
        <div className="grid grid-cols-2 min-[560px]:grid-cols-3 min-[860px]:grid-cols-4 xl:grid-cols-7 gap-[6px]">
          <StatCard
            label="Bakiye"
            value={`${formatCoins(player.balance)} LC`}
            accent="text-g42-coin-d"
            icon={<CoinIcon size={13} />}
          />
          <StatCard
            label="Haftalık"
            value={`${formatCoins(player.weekly_coins)} LC`}
            accent="text-g42-good"
          />
          <StatCard
            label="Toplam"
            value={`${formatCoins(player.total_coins)} LC`}
          />
          <StatCard
            label="Cursus"
            value={cursusText}
          />
          <StatCard
            label="Dün"
            value={
              Number.isFinite(yesterdayHours)
                ? formatHours(yesterdayHours)
                : "–"
            }
            accent="text-g42-accent-2"
          />
          <StatCard
            label="Seviye"
            value={`Lv ${playerLevel}`}
            accent="text-g42-accent-2"
          />
          <StatCard
            label="PC"
            value={`${pcLevel}/${PC_MAX_LEVEL}`}
            accent="text-g42-good"
          />
        </div>
      </div>
    </div>
  );
}
