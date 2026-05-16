"use client";

import { useState } from "react";

export default function LeaderboardTable({ weekly, allTime }) {
  const [tab, setTab] = useState("weekly");
  const rows = tab === "weekly" ? weekly : allTime;
  const coinKey = tab === "weekly" ? "weekly_coins" : "total_coins";

  return (
    <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
      <p className="title">Skor Tablosu</p>
      <div className="flex gap-2">
        <button
          type="button"
          className={`nes-btn text-xs ${tab === "weekly" ? "is-primary" : ""}`}
          onClick={() => setTab("weekly")}
        >
          Bu Hafta
        </button>
        <button
          type="button"
          className={`nes-btn text-xs ${tab === "alltime" ? "is-primary" : ""}`}
          onClick={() => setTab("alltime")}
        >
          Tüm Zamanlar
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="nes-table is-bordered g42-rank-table min-w-[620px] !bg-g42-paper !text-g42-ink w-full text-xs">
          <thead>
            <tr>
              <th className="align-middle !bg-g42-paper !text-g42-ink">#</th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">Login</th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">LogCoin</th>
              <th className="align-middle !bg-g42-paper !text-g42-ink">Seri</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.intra_login}>
                <td className="align-middle !bg-g42-paper !text-g42-ink">
                  <span className={`inline-grid place-items-center w-[34px] h-[34px] border-[3px] border-g42-line font-[var(--font-silkscreen),monospace] ${i < 3 ? "bg-g42-coin text-g42-coin-ink" : "bg-g42-bg-2"}`}>{i + 1}</span>
                </td>
                <td className="align-middle !bg-g42-paper !text-g42-ink m-0 font-[var(--font-silkscreen),monospace] tracking-[0]">{row.intra_login}</td>
                <td className="align-middle !bg-g42-paper !text-g42-ink m-0 font-[var(--font-silkscreen),monospace] tracking-[0]">
                  {Number(row[coinKey] ?? 0).toLocaleString("tr-TR")} LC
                </td>
                <td className="align-middle !bg-g42-paper !text-g42-ink m-0 font-[var(--font-silkscreen),monospace] tracking-[0]">{row.current_streak}g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
