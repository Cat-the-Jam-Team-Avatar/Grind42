"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PixelSprite, { CoinIcon } from "@/components/ui/PixelSprite";
import { usePlayerStore } from "@/store/usePlayerStore";
import UseItemButton from "./UseItemButton";

const SPRITE_MAP = {
  chair: "chair",
  "coffee-machine": "cup",
  keyboard: "keyboard",
  "plant-pot": "plant",
  monitor: "monitor",
  "sleeping-cat": "cat",
  "toilet-paper": "scroll",
  "toilet-plant": "plant",
  "vending-machine": "monitor",
  duck: "book",
  flowers: "plant",
  lamp: "monitor",
  scroll: "scroll",
  cat: "cat",
  frieren: "book",
  cup: "cup",
};

export default function MarketItem({
  canAfford,
  equipped = false,
  item,
  owned,
  quantity = 0,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const insufficientSoundRef = useRef(null);
  const purchaseSoundRef = useRef(null);

  useEffect(() => {
    insufficientSoundRef.current = new Audio("/cluster/sound/click_insufficient.wav");
    insufficientSoundRef.current.preload = "auto";
    insufficientSoundRef.current.volume = 0.4;
    return () => {
      if (insufficientSoundRef.current) {
        insufficientSoundRef.current.pause();
        insufficientSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    purchaseSoundRef.current = new Audio("/cluster/sound/click_purchasing.wav");
    purchaseSoundRef.current.preload = "auto";
    purchaseSoundRef.current.volume = 0.45;
    return () => {
      if (purchaseSoundRef.current) {
        purchaseSoundRef.current.pause();
        purchaseSoundRef.current = null;
      }
    };
  }, []);

  async function handleBuy() {
    if (!canAfford) {
      if (insufficientSoundRef.current) {
        insufficientSoundRef.current.currentTime = 0;
        insufficientSoundRef.current.play().catch(() => {});
      }
      return;
    }
    setLoading(true);
    setFeedback(null);
    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    const data = await res.json().catch(() => ({}));

    setFeedback(res.ok ? "Satın alındı." : data.error);
    setLoading(false);

    if (res.ok) {
      if (purchaseSoundRef.current) {
        purchaseSoundRef.current.currentTime = 0;
        purchaseSoundRef.current.play().catch(() => {});
      }
      if (Number.isFinite(Number(data.newBalance))) {
        usePlayerStore.setState({ balance: Number(data.newBalance) });
      }

      router.refresh();
    }
  }

  const disabled = loading || (item.category !== "consumable" && owned);
  const spriteName = SPRITE_MAP[item.sprite] ?? "coin";

  return (
    <article className="nes-container flex min-w-0 flex-col min-h-full gap-[10px] !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif]">
      <div className="grid place-items-center min-h-[110px] border-[3px] border-g42-line bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),var(--g42-paper-2)] [background-size:9px_9px]">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt={item.name}
            draggable={false}
            style={{ width: 64, height: 64, objectFit: "contain", imageRendering: "pixelated" }}
          />
        ) : (
          <PixelSprite
            name={spriteName}
            scale={spriteName === "monitor" ? 3 : 4}
          />
        )}
      </div>
      <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[15px] leading-[1.15]">
        {item.name}
      </p>
      <p className="flex-1 text-g42-ink-soft text-[17px] leading-[1.25] max-[560px]:text-[16px]">
        {item.description}
      </p>
      <div className="flex items-center justify-between text-g42-coin-d gap-[10px] font-[var(--font-silkscreen),monospace]">
        <span className="inline-flex items-center gap-2">
          <CoinIcon size={16} />
          {item.price.toLocaleString("tr-TR")} LC
        </span>
        {item.category === "consumable" && quantity > 0 && (
          <span className="text-g42-ink-soft text-[11px]">x{quantity}</span>
        )}
      </div>
      {item.category !== "consumable" && owned ? (
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <span className="inline-flex items-center m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-2 py-[6px] text-[11px]">
            Sahipsin
          </span>
          <UseItemButton
            compact
            equipped={equipped}
            item={item}
            quantity={quantity || 1}
          />
        </div>
      ) : (
        <div className="flex min-w-0 flex-wrap items-start gap-2">
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
          {owned && item.category === "consumable" && (
            <UseItemButton
              compact
              item={item}
              quantity={quantity}
            />
          )}
        </div>
      )}
      {feedback && (
        <p
          className={`nes-text text-xs ${feedback === "Satın alındı." ? "is-success" : "is-error"}`}
        >
          {feedback}
        </p>
      )}
    </article>
  );
}
