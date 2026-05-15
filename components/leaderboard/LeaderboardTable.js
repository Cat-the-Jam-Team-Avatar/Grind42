"use client";

import { useState } from "react";

export default function LeaderboardTable({ weekly, allTime }) {
  const [tab, setTab] = useState("weekly");
  const rows = tab === "weekly" ? weekly : allTime;
  const coinKey = tab === "weekly" ? "weekly_coins" : "total_coins";

  return (
    <div className="flex flex-col gap-4">
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

      <table className="nes-table is-bordered is-dark w-full text-xs">
        <thead>
          <tr>
            <th className="nes-text">#</th>
            <th className="nes-text">Login</th>
            <th className="nes-text">LogCoin</th>
            <th className="nes-text">Seri</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.intra_login} className={i === 0 ? "bg-yellow-900/30" : ""}>
              <td className="nes-text">{i + 1}</td>
              <td className="nes-text">{row.intra_login}</td>
              <td className="nes-text is-warning">{row[coinKey]}</td>
              <td className="nes-text">{row.current_streak}g</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
