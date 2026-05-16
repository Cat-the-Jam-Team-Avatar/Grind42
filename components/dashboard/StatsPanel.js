"use client";

import ProfileAvatar from "@/components/ProfileAvatar";

function formatHours(hours) {
  if (!Number.isFinite(hours)) return "-";

  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${wholeHours}s ${minutes.toString().padStart(2, "0")}dk`;
}

export default function StatsPanel({ player, yesterdayLogtime }) {
  if (!player) return null;

  const displayName = player.display_name ?? player.intra_login;
  const yesterdayDate = yesterdayLogtime?.date ?? player.last_logtime_date;
  const yesterdayHours = Number.isFinite(yesterdayLogtime?.hours)
    ? yesterdayLogtime.hours
    : Number(player.last_logtime_hours);

  return (
    <div className="nes-container is-dark with-title">
      <p className="title nes-text text-xs">İstatistikler</p>
      <div className="flex flex-col gap-2 text-xs">
        <div className="mb-2 flex items-center gap-3">
          <ProfileAvatar
            label={displayName}
            size={48}
            src={player.profile_image_url}
          />
          <div className="min-w-0">
            <p className="truncate text-[10px] text-[#f8d44b]">{displayName}</p>
            <p className="truncate text-[8px] text-white/50">
              {player.campus_name ?? player.campus_time_zone ?? "42"}
            </p>
          </div>
        </div>
        <p>
          <span className="nes-text is-disabled">Login: </span>
          <span className="nes-text">{player.intra_login}</span>
        </p>
        <p>
          <span className="nes-text is-disabled">Bakiye: </span>
          <span className="nes-text is-warning">{player.balance} LC</span>
        </p>
        <p>
          <span className="nes-text is-disabled">Haftalık: </span>
          <span className="nes-text is-success">{player.weekly_coins} LC</span>
        </p>
        <p>
          <span className="nes-text is-disabled">Toplam: </span>
          <span className="nes-text">{player.total_coins} LC</span>
        </p>
        <p>
          <span className="nes-text is-disabled">Cursus: </span>
          <span className="nes-text">
            {player.cursus_level !== null && player.cursus_level !== undefined
              ? `${player.cursus_name ?? "42"} Lv ${Number(player.cursus_level).toFixed(2)}`
              : "-"}
          </span>
        </p>
        <p>
          <span className="nes-text is-disabled">Dünkü: </span>
          <span className="nes-text">
            {yesterdayDate && Number.isFinite(yesterdayHours)
              ? `${yesterdayDate} ${formatHours(yesterdayHours)}`
              : "-"}
          </span>
        </p>
      </div>
    </div>
  );
}
