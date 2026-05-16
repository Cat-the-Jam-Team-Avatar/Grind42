"use client";

import PixelSprite from "@/components/ui/PixelSprite";

function normalizeInventory(inventory) {
  return (inventory ?? []).map((item) => (typeof item === "string" ? item : item?.item_id ?? item?.id));
}

export default function PixelDesk({ inventory }) {
  const ownedIds = normalizeInventory(inventory);
  const has = (id) => ownedIds.includes(id);

  return (
    <div className="relative overflow-hidden min-h-[360px] border-[4px] border-g42-line bg-[linear-gradient(180deg,var(--g42-sky)_0%,var(--g42-sky-2)_52%,var(--g42-bg-2)_52%,var(--g42-bg-2)_100%)] shadow-[0_5px_0_var(--g42-line)] before:content-[''] before:absolute before:right-[8%] before:top-[10%] before:w-[90px] before:h-[66px] before:border-[3px] before:border-g42-line before:bg-[linear-gradient(180deg,#ffe070,#f8a548)] before:shadow-[3px_3px_0_var(--g42-line)] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[42%] after:[border-top:4px_solid_var(--g42-line)] after:bg-[repeating-linear-gradient(180deg,var(--g42-wood)_0_7px,var(--g42-wood-d)_7px_9px,var(--g42-wood)_9px_15px)] max-[560px]:min-h-[300px]" aria-label="Pixel art çalışma masası">
      <div className="absolute grid place-items-center z-[1] text-g42-accent-2 left-[7%] top-[13%] w-[68px] h-[82px] border-[3px] border-g42-line bg-g42-paper shadow-[3px_3px_0_var(--g42-line)] font-[var(--font-silkscreen),monospace] -rotate-[3deg]">42</div>

      {has("ergonomic_chair") && (
        <div className="absolute z-[2] left-1/2 bottom-[1%] -translate-x-1/2">
          <PixelSprite name="chair" scale={4} />
        </div>
      )}

      <div className="absolute z-[2] left-1/2 bottom-[27%] -translate-x-1/2">
        <PixelSprite name="monitor" scale={has("dual_monitor") ? 4 : 3.4} />
      </div>

      <div className="absolute z-[2] left-1/2 bottom-[13%] -translate-x-1/2">
        <PixelSprite name="keyboard" scale={has("mech_keyboard") ? 3.5 : 3} />
      </div>

      <div className="absolute z-[2] right-[18%] bottom-[16%]">
        <PixelSprite name="mouse" scale={3.2} />
      </div>

      <div className="absolute z-[2] left-[8%] bottom-[31%]">
        <PixelSprite name="plant" scale={2.5} />
      </div>

      {has("loba_cup") && (
        <div className="absolute z-[2] right-[7%] bottom-[31%]">
          <PixelSprite name="cup" scale={3.2} />
        </div>
      )}

      {has("pixel_cat") && (
        <div className="absolute z-[2] left-[18%] bottom-[17%]">
          <PixelSprite name="cat" scale={2.3} />
        </div>
      )}
    </div>
  );
}
