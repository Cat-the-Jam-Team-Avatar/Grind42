"use client";

export default function StatsPanel({ player }) {
  if (!player) return null;

  const stats = [
    ["Login", player.intra_login],
    ["Bakiye", `${Number(player.balance ?? 0).toLocaleString("tr-TR")} LC`],
    ["Haftalık", `${Number(player.weekly_coins ?? 0).toLocaleString("tr-TR")} LC`],
    ["Toplam", `${Number(player.total_coins ?? 0).toLocaleString("tr-TR")} LC`],
  ];

  return (
    <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
      <p className="title">İstatistikler</p>
      <div>
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-g42-ink-soft gap-3 [border-bottom:2px_dashed_var(--g42-grid)] last:[border-bottom:0] py-[9px] text-[18px] max-[560px]:text-[16px]">
            <span>{label}</span>
            <span className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[18px]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
