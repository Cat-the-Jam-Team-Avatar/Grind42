"use client";

import MarketItem from "./MarketItem";

const CATEGORY_LABELS = {
  upgrade: "Geliştirmeler",
  consumable: "Taktiksel Eşyalar",
  cosmetic: "Kozmetik & Prestij",
};

export default function MarketGrid({ items, balance, ownedIds }) {
  const categories = ["upgrade", "consumable", "cosmetic"];

  return (
    <div className="flex flex-col gap-5">
      {categories.map((cat) => (
        <section key={cat} className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
          <p className="title">{CATEGORY_LABELS[cat]}</p>
          <div className="grid grid-cols-3 gap-[14px] max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <MarketItem
                  key={item.id}
                  item={item}
                  canAfford={balance >= item.price}
                  owned={ownedIds.includes(item.id)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
