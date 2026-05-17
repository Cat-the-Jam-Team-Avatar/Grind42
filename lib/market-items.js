// Market item definitions — temporarily extracted from the old economy.js.
// TODO: Move to DB or a shared config once the market system is redesigned.

export const MARKET_ITEMS = [
  // ── Core Upgrades ──────────────────────────────────────────────
  {
    id: "ergonomic_chair",
    name: "Ergonomik Koltuk",
    description: "Saatlik taban kazancı %10 artırır.",
    price: 500,
    category: "upgrade",
    consumable: false,
    bonusPercent: 10,
    sprite: "chair",
  },
  {
    id: "mech_keyboard",
    name: "Mekanik Klavye",
    description: "Saatlik taban kazancı %15 artırır.",
    price: 800,
    category: "upgrade",
    consumable: false,
    bonusPercent: 15,
    sprite: "keyboard",
  },
  {
    id: "dual_monitor",
    name: "Çift Monitör Kurulumu",
    description: "Saatlik taban kazancı %20 artırır.",
    price: 1200,
    category: "upgrade",
    consumable: false,
    bonusPercent: 20,
    sprite: "monitor",
  },

  // ── Consumables ────────────────────────────────────────────────
  {
    id: "grace_period",
    name: "Bocal İzni",
    description: "Bir gün seriyi donduran tek kullanımlık kağıt.",
    price: 2000,
    category: "consumable",
    consumable: true,
    sprite: "scroll",
  },

  // ── Cosmetics ──────────────────────────────────────────────────
  {
    id: "pixel_cat",
    name: "Uyuyan Pixel Kedi",
    description: "Klavyenin yanında uyuyan sevimli figür.",
    price: 300,
    category: "cosmetic",
    consumable: false,
    sprite: "cat",
  },
  {
    id: "frieren_vol",
    name: "Frieren Cilt Koleksiyonu",
    description: "8-bit formatında Frieren cildi.",
    price: 400,
    category: "cosmetic",
    consumable: false,
    sprite: "frieren",
  },
  {
    id: "loba_cup",
    name: "Loba Coffee Bardağı",
    description: "Ortam hissini artıran retro bardak.",
    price: 200,
    category: "cosmetic",
    consumable: false,
    sprite: "cup",
  },
];

export function applyUpgradeBonus(baseHours, ownedItemIds) {
  const upgrades = MARKET_ITEMS.filter(
    (item) => item.category === "upgrade" && ownedItemIds.includes(item.id)
  );
  const totalBonus = upgrades.reduce((acc, item) => acc + item.bonusPercent, 0);
  return baseHours * (1 + totalBonus / 100);
}
