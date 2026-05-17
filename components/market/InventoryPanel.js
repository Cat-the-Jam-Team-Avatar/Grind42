"use client";

import PixelSprite from "@/components/ui/PixelSprite";
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

export default function InventoryPanel({
  allItems,
  equippedById,
  ownedIds,
  quantityById,
}) {
  const owned = allItems.filter((i) => ownedIds.includes(i.id));

  if (owned.length === 0) return null;

  return (
    <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
      <p className="title">Envanter</p>
      <ul className="flex flex-wrap gap-[10px]">
        {owned.map((item) => (
          <li
            key={item.id}
            className="inline-flex items-center m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-2 py-[6px] text-[11px]"
          >
            <PixelSprite name={SPRITE_MAP[item.sprite] ?? "coin"} scale={1.5} />
            <span>
              {item.name}
              {(quantityById?.[item.id] ?? 0) > 1
                ? ` x${quantityById[item.id]}`
                : ""}
            </span>
            <UseItemButton
              compact
              equipped={Boolean(equippedById?.[item.id])}
              item={item}
              quantity={quantityById?.[item.id] ?? 1}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
