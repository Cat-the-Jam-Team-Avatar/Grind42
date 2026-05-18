"use client";

import MarketItem from "./MarketItem";
import MarketItemVariant from "./MarketItemVariant";

const CATEGORY_LABELS = {
  consumable: "Taktiksel Eşyalar",
  cosmetic: "Kozmetik & Prestij",
};

// Kategori içindeki items listesini gruplara ayırır.
// variantOf alanı olan itemler aynı grup altında toplanır,
// diğerleri tek tek kendi başına "single" olarak kalır.
function groupItems(items) {
  const groups = [];
  const variantGroups = new Map(); // variantOf → index in groups

  for (const item of items) {
    if (!item.variantOf) {
      groups.push({ type: "single", item });
    } else {
      if (!variantGroups.has(item.variantOf)) {
        const idx = groups.length;
        variantGroups.set(item.variantOf, idx);
        groups.push({ type: "variant-group", variants: [] });
      }
      const idx = variantGroups.get(item.variantOf);
      groups[idx].variants.push(item);
    }
  }

  return groups;
}

export default function MarketGrid({
  balance,
  equippedById,
  items,
  ownedIds,
  quantityById,
}) {
  const categories = ["consumable", "cosmetic"];

  return (
    <div className="flex flex-col gap-5">
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat);
        const groups = groupItems(catItems);

        return (
          <section
            key={cat}
            className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title"
          >
            <p className="title">{CATEGORY_LABELS[cat]}</p>
            <div className="grid grid-cols-3 gap-[14px] max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
              {groups.map((group) =>
                group.type === "single" ? (
                  <MarketItem
                    key={group.item.id}
                    item={group.item}
                    canAfford={balance >= group.item.price}
                    equipped={Boolean(equippedById?.[group.item.id])}
                    owned={ownedIds.includes(group.item.id)}
                    quantity={quantityById?.[group.item.id] ?? 0}
                  />
                ) : (
                  <MarketItemVariant
                    key={group.variants[0].variantOf}
                    variants={group.variants}
                    balance={balance}
                    ownedIds={ownedIds}
                    equippedById={equippedById}
                    quantityById={quantityById}
                  />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
