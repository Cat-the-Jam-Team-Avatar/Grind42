"use client";

import { useState } from "react";

export default function MarketItem({ item, canAfford, owned }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  async function handleBuy() {
    setLoading(true);
    setFeedback(null);
    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await res.json();
    setFeedback(res.ok ? `✓ Satın alındı!` : data.error);
    setLoading(false);
  }

  const disabled = loading || (!item.consumable && owned) || !canAfford;

  return (
    <div className="nes-container is-dark flex flex-col gap-2">
      <p className="nes-text text-xs">{item.name}</p>
      <p className="nes-text is-disabled" style={{ fontSize: "0.55rem" }}>
        {item.description}
      </p>
      <p className="nes-text is-warning text-xs">{item.price} LC</p>
      {!item.consumable && owned ? (
        <span className="nes-text is-success text-xs">Sahipsin ✓</span>
      ) : (
        <button
          type="button"
          className={`nes-btn text-xs ${
            !canAfford ? "is-disabled" : "is-primary"
          }`}
          disabled={disabled}
          onClick={handleBuy}
        >
          {loading ? "..." : "Satın Al"}
        </button>
      )}
      {feedback && (
        <p className="nes-text is-success" style={{ fontSize: "0.55rem" }}>
          {feedback}
        </p>
      )}
    </div>
  );
}
