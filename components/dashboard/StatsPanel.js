"use client";

export default function StatsPanel({ player }) {
  if (!player) return null;

  return (
    <div className="nes-container is-dark with-title">
      <p className="title nes-text text-xs">İstatistikler</p>
      <div className="flex flex-col gap-2 text-xs">
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
      </div>
    </div>
  );
}
