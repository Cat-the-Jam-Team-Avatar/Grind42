import { getMultiplier } from "./streak";

// ── Pasif gelir (logtime) ─────────────────────────────────────────────
const COINS_PER_MINUTE = 5; // 300 coin/saat base

export const PC_UPGRADE_COSTS = [
  500, 750, 1100, 1700, 2500, 3800, 5700, 8500, 12800, 19200,
];
export const PC_MAX_LEVEL = 10;

export function calcBasePoints(logMinutes) {
  return Math.floor(logMinutes * COINS_PER_MINUTE);
}

export function calcUpgradeMultiplier(pcLevel) {
  return 1 + Math.min(pcLevel, PC_MAX_LEVEL) * 0.005;
}

export function calcEarnings(logMinutes, streakMult, pcLevel) {
  return Math.round(
    calcBasePoints(logMinutes) * streakMult * calcUpgradeMultiplier(pcLevel),
  );
}

export function calcUpgradeCost(currentLevel) {
  if (currentLevel >= PC_MAX_LEVEL) return null;
  return PC_UPGRADE_COSTS[currentLevel];
}

// ── Claim çarpanları ──────────────────────────────────────────────────
export function calcRemoteClaimMultiplier(playerLevel) {
  return 0.3 + playerLevel * 0.01;
}

// ── Tıklama sistemi ───────────────────────────────────────────────────
export const CLICK_WINDOW_MAX = 1000;
export const CLICK_WINDOW_HOURS = 4;

export function calcClickPower(playerLevel) {
  return 0.5 + playerLevel * 0.05;
}

// 1–24 → 1x | 25–74 → 1.5x | 75+ → 2x
export function calcComboMultiplier(comboCount) {
  if (comboCount >= 75) return 2;
  if (comboCount >= 25) return 1.5;
  return 1;
}

export function calcComboDecayMs(playerLevel) {
  return 1500 + playerLevel * 100;
}

// ── Lucky 10 dakika ───────────────────────────────────────────────────
export function calcLuckyMultiplier(playerLevel) {
  return 2.0 + playerLevel * 0.1;
}

// ── Haftalık streak bonusu ────────────────────────────────────────────
export function calcWeeklyStreakBonus(playerLevel) {
  return playerLevel * 100;
}

// ── XP eğrisi: 100 × 1.5^(n-1) ──────────────────────────────────────
export function xpForNextLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calcPlayerLevel(totalXp) {
  let level = 1;
  let accumulated = 0;
  while (totalXp >= accumulated + xpForNextLevel(level)) {
    accumulated += xpForNextLevel(level);
    level++;
  }
  return level;
}

export function xpProgressInLevel(totalXp) {
  let level = 1;
  let accumulated = 0;
  while (totalXp >= accumulated + xpForNextLevel(level)) {
    accumulated += xpForNextLevel(level);
    level++;
  }
  return { current: totalXp - accumulated, needed: xpForNextLevel(level) };
}

// ── XP kaynakları ────────────────────────────────────────────────────
export const XP_SOURCES = {
  // Tıklama
  first_daily_click: 25, // günün ilk tıkı
  click_milestone: 50, // her 500 toplam tıkta
  max_combo: 30, // 75+ combo'ya seans başına ilk kez ulaşınca
  lucky_participation: 75, // lucky 10 dakikada tıklayınca

  // Claim & logtime
  daily_claim: 50, // her gün claim yapınca
  early_bird: 100, // 08:00–10:00 arası claim
  night_owl: 100, // 22:00+ claim
  high_logtime: 100, // 6+ saat logtime bonusu
  daily_record: 200, // kendi günlük logtime rekorunu kırınca

  // Streak milestones (tek seferlik)
  streak_3: 150,
  streak_7: 500,
  streak_14: 1000,
  streak_30: 3000,
  weekly_streak: 300, // 7 günlük haftalık tamamlama

  // Satın alma
  pc_upgrade: 150, // her PC yükseltme
  decoration: 80, // kozmetik satın alma
  first_purchase: 200, // ilk satın alma (tek seferlik)

  // Sosyal & leaderboard (Dev 3 tetikler)
  leaderboard_top10: 500, // haftalık top 10'a girince
  rank_improvement: 200, // geçen haftaya göre sıralama yükselince

  // Başarı & proje
  achievement: 200, // achievement açınca
  project_completion: 100, // proje validate edilince

  // Toplam logtime milestones (tek seferlik, Dev 3 tetikler)
  logtime_100h: 800,
  logtime_500h: 3000,
  logtime_1000h: 8000,

  // Level atlama
  level_up_gift: 50, // her level atlamada (sonraki seviye için motivasyon)
};

// ── Market kataloğu ───────────────────────────────────────────────────
export const MARKET_CATALOG = [
  {
    id: "combo_shield",
    name: "Combo Shield",
    description: "30 dakika combo bar erimez.",
    price: 1000,
    category: "consumable",
    image: "/cluster/market/powerup/combo-shield.png",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "click_frenzy",
    name: "Click Frenzy",
    description: "1 saat boyunca click window kaldırılır.",
    price: 2000,
    category: "consumable",
    image: "/cluster/market/powerup/click-frenzy.png",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "freeze",
    name: "Freeze",
    description: "O gün 0 coin ama streak korunur.",
    price: 4000,
    category: "consumable",
    image: "/cluster/market/powerup/freeze.png",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "espresso",
    name: "Çift Shot Espresso",
    description: "Sonraki claim'de logtime 2x sayılır.",
    price: 3000,
    category: "consumable",
    image: "/cluster/market/powerup/double-shot-espresso.png",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "xp_bomb",
    name: "XP Bombası",
    description: "Anında 500 XP kazanırsın.",
    price: 5000,
    category: "consumable",
    image: "/cluster/market/powerup/xp-bomb.png",
    xp_reward: 500,
    xp: XP_SOURCES.decoration,
  },
  {
    id: "streak_restore",
    name: "Streak Kurtarma",
    description: "Bozulan streak'i eski değerine döndürür.",
    price: 20000,
    category: "consumable",
    image: "/cluster/market/powerup/streak-recover.png",
    xp: XP_SOURCES.decoration,
  },

  // ── Dekorasyonlar ──────────────────────────────────────────────────
  {
    id: "toilet_paper",
    name: "Tuvalet Kağıdı",
    description: "Açıklamaya gerek yok.",
    price: 300,
    category: "cosmetic",
    sprite: "toilet-paper",
    image: "/cluster/market/cosmetic/toilet_paper.png",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "rubber_duck",
    name: "Ördek",
    description: "Debug arkadaşın.",
    price: 400,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/duck.png",
    xp: XP_SOURCES.decoration,
  },
  // ── Kafatası varyasyonları ─────────────────────────────────────────
  {
    id: "skull_1",
    name: "Kafatası – 1",
    description: "Masana karanlık bir hava katar.",
    price: 400,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/skull/skull-1.png",
    xp: XP_SOURCES.decoration,
    variantOf: "skull",
    variantLabel: "1",
    variantGroupName: "Kafatası",
    variantGroupDescription: "Masana karanlık bir hava katar.",
  },
  {
    id: "skull_2",
    name: "Kafatası – 2",
    description: "Masana karanlık bir hava katar.",
    price: 400,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/skull/skull-2.png",
    xp: XP_SOURCES.decoration,
    variantOf: "skull",
    variantLabel: "2",
    variantGroupName: "Kafatası",
    variantGroupDescription: "Masana karanlık bir hava katar.",
  },
  {
    id: "skull_3",
    name: "Kafatası – 3",
    description: "Masana karanlık bir hava katar.",
    price: 400,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/skull/skull-3.png",
    xp: XP_SOURCES.decoration,
    variantOf: "skull",
    variantLabel: "3",
    variantGroupName: "Kafatası",
    variantGroupDescription: "Masana karanlık bir hava katar.",
  },
  {
    id: "skull_4",
    name: "Kafatası – 4",
    description: "Masana karanlık bir hava katar.",
    price: 400,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/skull/skull-4.png",
    xp: XP_SOURCES.decoration,
    variantOf: "skull",
    variantLabel: "4",
    variantGroupName: "Kafatası",
    variantGroupDescription: "Masana karanlık bir hava katar.",
  },
  // ── Abajur varyasyonları ───────────────────────────────────────────
  {
    id: "lampshade_1",
    name: "Abajur – 1",
    description: "Gece seansları için atmosfer.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/lampshade/lampshade-1.png",
    xp: XP_SOURCES.decoration,
    variantOf: "lampshade",
    variantLabel: "1",
    variantGroupName: "Abajur",
    variantGroupDescription: "Gece seansları için atmosfer.",
  },
  {
    id: "lampshade_2",
    name: "Abajur – 2",
    description: "Gece seansları için atmosfer.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/lampshade/lampshade-2.png",
    xp: XP_SOURCES.decoration,
    variantOf: "lampshade",
    variantLabel: "2",
    variantGroupName: "Abajur",
    variantGroupDescription: "Gece seansları için atmosfer.",
  },
  {
    id: "lampshade_3",
    name: "Abajur – 3",
    description: "Gece seansları için atmosfer.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/lampshade/lampshade-3.png",
    xp: XP_SOURCES.decoration,
    variantOf: "lampshade",
    variantLabel: "3",
    variantGroupName: "Abajur",
    variantGroupDescription: "Gece seansları için atmosfer.",
  },
  // ── Uyuyan Kedi varyasyonları ──────────────────────────────────────
  {
    id: "sleeping_cat_black",
    name: "Uyuyan Kedi – Siyah",
    description: "Klavyenin yanında uyuyan sevimli arkadaş.",
    price: 1000,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-black.png",
    xp: XP_SOURCES.decoration,
    variantOf: "sleeping_cat",
    variantLabel: "Siyah",
    variantGroupName: "Uyuyan Kedi",
    variantGroupDescription: "Klavyenin yanında uyuyan sevimli arkadaş.",
  },
  {
    id: "sleeping_cat_brown",
    name: "Uyuyan Kedi – Kahverengi",
    description: "Klavyenin yanında uyuyan sevimli arkadaş.",
    price: 1000,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-brown.png",
    xp: XP_SOURCES.decoration,
    variantOf: "sleeping_cat",
    variantLabel: "Kahverengi",
    variantGroupName: "Uyuyan Kedi",
    variantGroupDescription: "Klavyenin yanında uyuyan sevimli arkadaş.",
  },
  {
    id: "sleeping_cat_cream",
    name: "Uyuyan Kedi – Krem",
    description: "Klavyenin yanında uyuyan sevimli arkadaş.",
    price: 1000,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-cream.png",
    xp: XP_SOURCES.decoration,
    variantOf: "sleeping_cat",
    variantLabel: "Krem",
    variantGroupName: "Uyuyan Kedi",
    variantGroupDescription: "Klavyenin yanında uyuyan sevimli arkadaş.",
  },
  {
    id: "sleeping_cat_orange",
    name: "Uyuyan Kedi – Turuncu",
    description: "Klavyenin yanında uyuyan sevimli arkadaş.",
    price: 1000,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-orange.png",
    xp: XP_SOURCES.decoration,
    variantOf: "sleeping_cat",
    variantLabel: "Turuncu",
    variantGroupName: "Uyuyan Kedi",
    variantGroupDescription: "Klavyenin yanında uyuyan sevimli arkadaş.",
  },
  {
    id: "sleeping_cat_white",
    name: "Uyuyan Kedi – Beyaz",
    description: "Klavyenin yanında uyuyan sevimli arkadaş.",
    price: 1000,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-white.png",
    xp: XP_SOURCES.decoration,
    variantOf: "sleeping_cat",
    variantLabel: "Beyaz",
    variantGroupName: "Uyuyan Kedi",
    variantGroupDescription: "Klavyenin yanında uyuyan sevimli arkadaş.",
  },

  // ── Masa varyasyonları ─────────────────────────────────────────────
  {
    id: "table_blue",
    name: "Masa – Mavi",
    description: "Oturma alanına stil katar.",
    price: 1500,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/table/table-blue.png",
    xp: XP_SOURCES.decoration,
    variantOf: "table",
    variantLabel: "Mavi",
    variantGroupName: "Masa",
    variantGroupDescription: "Oturma alanına stil katar.",
  },
  {
    id: "table_pink",
    name: "Masa – Pembe",
    description: "Oturma alanına stil katar.",
    price: 1500,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/table/table-pink.png",
    xp: XP_SOURCES.decoration,
    variantOf: "table",
    variantLabel: "Pembe",
    variantGroupName: "Masa",
    variantGroupDescription: "Oturma alanına stil katar.",
  },
  {
    id: "table_white",
    name: "Masa – Beyaz",
    description: "Oturma alanına stil katar.",
    price: 1500,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/table/table-white.png",
    xp: XP_SOURCES.decoration,
    variantOf: "table",
    variantLabel: "Beyaz",
    variantGroupName: "Masa",
    variantGroupDescription: "Oturma alanına stil katar.",
  },
  // ── Dans eden karakterler ──────────────────────────────────────────
  {
    id: "dancing_cat",
    name: "Dans Eden Kedi",
    description: "Cluster'a eğlence katar.",
    price: 1500,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/dancing/dancing-cat.gif",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "dancing_frog",
    name: "Dans Eden Kurbağa",
    description: "Pazartesi sendromuna çözüm.",
    price: 1500,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/dancing/dancing-frog.gif",
    xp: XP_SOURCES.decoration,
  },
  // ── Vazo varyasyonları ─────────────────────────────────────────────
  {
    id: "vase_blue_barrel_1",
    name: "Mavi Fıçı Vazo – 1",
    description: "Teras dekorasyonu.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-1.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_blue_barrel",
    variantLabel: "1",
    variantGroupName: "Mavi Fıçı Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_blue_barrel_2",
    name: "Mavi Fıçı Vazo – 2",
    description: "Teras dekorasyonu.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-2.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_blue_barrel",
    variantLabel: "2",
    variantGroupName: "Mavi Fıçı Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_blue_barrel_3",
    name: "Mavi Fıçı Vazo – 3",
    description: "Teras dekorasyonu.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-3.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_blue_barrel",
    variantLabel: "3",
    variantGroupName: "Mavi Fıçı Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_blue_barrel_4",
    name: "Mavi Fıçı Vazo – 4",
    description: "Teras dekorasyonu.",
    price: 800,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-4.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_blue_barrel",
    variantLabel: "4",
    variantGroupName: "Mavi Fıçı Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_plastic_bucket_1",
    name: "Plastik Kova Vazo – 1",
    description: "Teras dekorasyonu.",
    price: 600,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-1.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_plastic_bucket",
    variantLabel: "1",
    variantGroupName: "Plastik Kova Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_plastic_bucket_2",
    name: "Plastik Kova Vazo – 2",
    description: "Teras dekorasyonu.",
    price: 600,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-2.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_plastic_bucket",
    variantLabel: "2",
    variantGroupName: "Plastik Kova Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_plastic_bucket_3",
    name: "Plastik Kova Vazo – 3",
    description: "Teras dekorasyonu.",
    price: 600,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-3.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_plastic_bucket",
    variantLabel: "3",
    variantGroupName: "Plastik Kova Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_plastic_bucket_4",
    name: "Plastik Kova Vazo – 4",
    description: "Teras dekorasyonu.",
    price: 600,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-4.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_plastic_bucket",
    variantLabel: "4",
    variantGroupName: "Plastik Kova Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_toilet_1",
    name: "Tuvalet Vazo – 1",
    description: "Teras dekorasyonu.",
    price: 700,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-1.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_toilet",
    variantLabel: "1",
    variantGroupName: "Tuvalet Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_toilet_2",
    name: "Tuvalet Vazo – 2",
    description: "Teras dekorasyonu.",
    price: 700,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-2.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_toilet",
    variantLabel: "2",
    variantGroupName: "Tuvalet Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_toilet_3",
    name: "Tuvalet Vazo – 3",
    description: "Teras dekorasyonu.",
    price: 700,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-3.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_toilet",
    variantLabel: "3",
    variantGroupName: "Tuvalet Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },
  {
    id: "vase_toilet_4",
    name: "Tuvalet Vazo – 4",
    description: "Teras dekorasyonu.",
    price: 700,
    category: "cosmetic",
    image: "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-4.png",
    xp: XP_SOURCES.decoration,
    variantOf: "vase_toilet",
    variantLabel: "4",
    variantGroupName: "Tuvalet Vazo",
    variantGroupDescription: "Teras dekorasyonu.",
  },

  // ── Masa renkleri (theme) ──────────────────────────────────────────
  {
    id: "desk_green",
    name: "Yeşil Masa",
    description: "Klasik terminal yeşili.",
    price: 1000,
    category: "theme",
    color: "#4ade80",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "desk_purple",
    name: "Mor Masa",
    description: "Gece modu vibes.",
    price: 1000,
    category: "theme",
    color: "#a78bfa",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "desk_red",
    name: "Kırmızı Masa",
    description: "Tam gaz grind enerjisi.",
    price: 1000,
    category: "theme",
    color: "#f87171",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "desk_blue",
    name: "Mavi Masa",
    description: "Sakin ve odaklı.",
    price: 1000,
    category: "theme",
    color: "#60a5fa",
    xp: XP_SOURCES.decoration,
  },
  {
    id: "desk_gold",
    name: "Altın Masa",
    description: "Sadece en iyi grinder'lar için.",
    price: 5000,
    category: "theme",
    color: "#fbbf24",
    xp: XP_SOURCES.decoration,
  },
];

// Sabit coin bonusları
export const ACHIEVEMENT_BONUS = 300;
export const PROJECT_COMPLETION_BONUS = 500;

// Streak milestone eşikleri — sıralı kontrol için
export const STREAK_MILESTONES = [
  { days: 3, xp_key: "streak_3" },
  { days: 7, xp_key: "streak_7" },
  { days: 14, xp_key: "streak_14" },
  { days: 30, xp_key: "streak_30" },
];

export { getMultiplier };
