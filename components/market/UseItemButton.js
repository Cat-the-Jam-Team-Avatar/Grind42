"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UseItemButton({
  className = "",
  compact = false,
  equipped = false,
  item,
  quantity = 1,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const isEquippable = item.category !== "consumable";
  const isActive = isEquippable && equipped;
  const disabled = loading || isActive || quantity <= 0;

  async function handleUse() {
    setLoading(true);
    setFeedback(null);

    const res = await fetch("/api/inventory/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await res.json().catch(() => ({}));

    setFeedback(res.ok ? "Kullanıldı." : data.error);
    setLoading(false);

    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <span className={`inline-flex min-w-0 flex-col gap-1 ${className}`}>
      <button
        type="button"
        className={`nes-btn ${
          isActive ? "is-disabled" : "is-warning"
        } ${compact ? "text-[10px] px-2 py-1" : "text-xs"}`}
        disabled={disabled}
        onClick={handleUse}
      >
        {loading ? "..." : isActive ? "Kullanılıyor" : "Kullan"}
      </button>
      {feedback && (
        <span
          className={`nes-text text-[10px] leading-tight ${
            feedback === "Kullanıldı." ? "is-success" : "is-error"
          }`}
        >
          {feedback}
        </span>
      )}
    </span>
  );
}
