"use client";

import MarketItem from "./MarketItem";

const CATEGORY_LABELS = {
  upgrade: "Taban Puan Geliştirmeleri",
  consumable: "Taktiksel Eşyalar",
  cosmetic: "Kozmetik & Prestij",
};

export default function MarketGrid({ items, balance, ownedIds }) {
  const categories = ["upgrade", "consumable", "cosmetic"];

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => (
        <div key={cat}>
          <p className="nes-text is-primary text-xs mb-3">{CATEGORY_LABELS[cat]}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      ))}
    </div>
  );
}
