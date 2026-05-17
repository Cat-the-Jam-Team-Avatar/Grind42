"use client";

import PixelSprite from "@/components/ui/PixelSprite";

const SPRITE_MAP = {
  chair: "chair",
  keyboard: "keyboard",
  monitor: "monitor",
  scroll: "scroll",
  cat: "cat",
  frieren: "book",
  cup: "cup",
};

export default function InventoryPanel({ ownedIds, allItems }) {
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
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
