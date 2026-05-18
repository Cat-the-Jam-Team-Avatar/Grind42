"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CoinIcon } from "@/components/ui/PixelSprite";
import { usePlayerStore } from "@/store/usePlayerStore";
import UseItemButton from "./UseItemButton";

// Varyasyonlu ürün kartı bileşeni.
// Tek bir kart gösterir ama içinde thumbnail picker ile renk/varyasyon seçimi yapılabilir.
export default function MarketItemVariant({
  balance,
  equippedById,
  ownedIds,
  quantityById,
  variants, // aynı variantOf grubuna ait tüm ürünler
}) {
  const router = useRouter();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const selected = variants[selectedIdx];
  const isOwned = ownedIds.includes(selected.id);
  const isEquipped = Boolean(equippedById?.[selected.id]);
  const quantity = quantityById?.[selected.id] ?? 0;
  const canAfford = balance >= selected.price;
  const disabled = loading || isOwned || !canAfford;

  async function handleBuy() {
    setLoading(true);
    setFeedback(null);

    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: selected.id }),
    });
    const data = await res.json().catch(() => ({}));

    setFeedback(res.ok ? "Satın alındı." : (data.error ?? "Hata oluştu."));
    setLoading(false);

    if (res.ok) {
      if (Number.isFinite(Number(data.newBalance))) {
        usePlayerStore.setState({ balance: Number(data.newBalance) });
      }
      router.refresh();
    }
  }

  return (
    <article className="nes-container flex min-w-0 flex-col min-h-full gap-[10px] !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif]">
      {/* Görsel alan: büyük resim + thumbnail picker */}
      <div className="flex flex-col gap-[8px] border-[3px] border-g42-line bg-[radial-gradient(var(--g42-grid)_1px,transparent_1px),var(--g42-paper-2)] [background-size:9px_9px] p-2">
        {/* Seçili varyantın büyük resmi */}
        <div className="grid place-items-center min-h-[90px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selected.image}
            alt={selected.name}
            draggable={false}
            style={{
              width: 64,
              height: 64,
              objectFit: "contain",
              imageRendering: "pixelated",
            }}
          />
        </div>

        {/* Thumbnail varyasyon seçici */}
        <div className="flex flex-wrap justify-center gap-[5px]">
          {variants.map((variant, idx) => {
            const owned = ownedIds.includes(variant.id);
            const isSelected = idx === selectedIdx;

            return (
              <button
                key={variant.id}
                type="button"
                title={variant.variantLabel}
                onClick={() => {
                  setSelectedIdx(idx);
                  setFeedback(null);
                }}
                className={[
                  "relative grid place-items-center border-[3px] transition-none",
                  "w-[34px] h-[34px] bg-g42-paper",
                  isSelected
                    ? "border-g42-ink"
                    : "border-g42-line hover:border-g42-ink-soft",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={variant.image}
                  alt={variant.variantLabel}
                  draggable={false}
                  style={{
                    width: 22,
                    height: 22,
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />
                {/* Sahip olunan varyantlara yeşil tik overlay */}
                {owned && (
                  <span
                    className="absolute bottom-0 right-0 w-[10px] h-[10px] bg-[#22c55e] border-[2px] border-g42-paper"
                    aria-label="Sahipsin"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ürün başlığı — grup adı gösterilir */}
      <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[15px] leading-[1.15]">
        {selected.variantGroupName}
        <span className="text-g42-ink-soft text-[11px] ml-[6px]">
          – {selected.variantLabel}
        </span>
      </p>

      {/* Açıklama */}
      <p className="flex-1 text-g42-ink-soft text-[17px] leading-[1.25] max-[560px]:text-[16px]">
        {selected.variantGroupDescription}
      </p>

      {/* Fiyat */}
      <div className="flex items-center justify-between text-g42-coin-d gap-[10px] font-[var(--font-silkscreen),monospace]">
        <span className="inline-flex items-center gap-2">
          <CoinIcon size={16} />
          {selected.price.toLocaleString("tr-TR")} LC
        </span>
      </div>

      {/* Eylem alanı */}
      {isOwned ? (
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <span className="inline-flex items-center m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-2 py-[6px] text-[11px]">
            Sahipsin
          </span>
          <UseItemButton
            compact
            equipped={isEquipped}
            item={selected}
            quantity={quantity || 1}
          />
        </div>
      ) : (
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <button
            type="button"
            className={`nes-btn text-xs ${!canAfford ? "is-disabled" : "is-primary"}`}
            disabled={disabled}
            onClick={handleBuy}
          >
            {loading ? "..." : "Satın Al"}
          </button>
        </div>
      )}

      {/* Geri bildirim mesajı */}
      {feedback && (
        <p
          className={`nes-text text-xs ${
            feedback === "Satın alındı." ? "is-success" : "is-error"
          }`}
        >
          {feedback}
        </p>
      )}
    </article>
  );
}
