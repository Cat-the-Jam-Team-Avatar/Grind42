"use client";

import ProfileAvatar from "@/components/ProfileAvatar";

function formatHours(hours) {
  if (!Number.isFinite(hours)) return "–";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}s ${m.toString().padStart(2, "0")}dk`;
}

function StatPill({ label, value, accent = "text-g42-ink" }) {
  return (
    <div className="flex flex-col gap-[3px] min-w-0">
      <span className="block font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted uppercase tracking-wide leading-none">
        {label}
      </span>
      <span
        className={`block font-[var(--font-silkscreen),monospace] text-[15px] font-bold leading-none ${accent}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function StatsPanel({ player, yesterdayLogtime }) {
  if (!player) return null;

  const displayName = player.display_name ?? player.intra_login;
  const yesterdayHours = Number.isFinite(yesterdayLogtime?.hours)
    ? yesterdayLogtime.hours
    : Number(player.last_logtime_hours);
  const cursusText =
    player.cursus_level != null
      ? `${player.cursus_name ?? "42"} Lv ${Number(player.cursus_level).toFixed(2)}`
      : "–";

  return (
    <div className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)]">
      <p className="title">Profil</p>
      <div className="flex items-center gap-5 flex-wrap">
        {/* Avatar + identity */}
        <div className="flex items-center gap-3 shrink-0">
          <ProfileAvatar
            label={displayName}
            size={52}
            src={player.profile_image_url}
          />
          <div>
            <p className="m-0 font-[var(--font-silkscreen),monospace] text-[16px] text-g42-ink leading-tight">
              {displayName}
            </p>
            <p className="m-0 font-[var(--font-silkscreen),monospace] text-[9px] text-g42-muted mt-1">
              {player.intra_login} · {player.campus_name ?? "42"}
            </p>
          </div>
        </div>

        {/* Vertical divider (hidden on small screens) */}
        <div
          className="hidden min-[560px]:block w-[3px] self-stretch bg-g42-line shrink-0"
          aria-hidden="true"
        />

        {/* Stat pills */}
        <div className="flex gap-6 flex-wrap flex-1 min-w-0">
          <StatPill
            label="Bakiye"
            value={`${player.balance ?? 0} LC`}
            accent="text-g42-coin-d"
          />
          <StatPill
            label="Haftalık"
            value={`${player.weekly_coins ?? 0} LC`}
            accent="text-g42-good"
          />
          <StatPill label="Toplam" value={`${player.total_coins ?? 0} LC`} />
          <StatPill label="Cursus" value={cursusText} />
          <StatPill
            label="Dün"
            value={
              Number.isFinite(yesterdayHours)
                ? formatHours(yesterdayHours)
                : "–"
            }
            accent="text-g42-accent-2"
          />
        </div>
      </div>
    </div>
  );
}
