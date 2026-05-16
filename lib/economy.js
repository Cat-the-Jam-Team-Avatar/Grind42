import { getMultiplier } from "./streak";

// ── Pasif gelir (logtime) ─────────────────────────────────────────────
const COINS_PER_MINUTE = 5; // 300 coin/saat base

export const PC_UPGRADE_COSTS = [500, 750, 1100, 1700, 2500, 3800, 5700, 8500, 12800, 19200];
export const PC_MAX_LEVEL = 10;

export function calcBasePoints(logMinutes) {
  return Math.floor(logMinutes * COINS_PER_MINUTE);
}

export function calcUpgradeMultiplier(pcLevel) {
  return 1 + Math.min(pcLevel, PC_MAX_LEVEL) * 0.005;
}

export function calcEarnings(logMinutes, streakMult, pcLevel) {
  return Math.round(calcBasePoints(logMinutes) * streakMult * calcUpgradeMultiplier(pcLevel));
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
  first_daily_click:     25,   // günün ilk tıkı
  click_milestone:       50,   // her 500 toplam tıkta
  max_combo:             30,   // 75+ combo'ya seans başına ilk kez ulaşınca
  lucky_participation:   75,   // lucky 10 dakikada tıklayınca

  // Claim & logtime
  daily_claim:           50,   // her gün claim yapınca
  early_bird:           100,   // 08:00–10:00 arası claim
  night_owl:            100,   // 22:00+ claim
  high_logtime:         100,   // 6+ saat logtime bonusu
  daily_record:         200,   // kendi günlük logtime rekorunu kırınca

  // Streak milestones (tek seferlik)
  streak_3:             150,
  streak_7:             500,
  streak_14:           1000,
  streak_30:           3000,
  weekly_streak:        300,   // 7 günlük haftalık tamamlama

  // Satın alma
  pc_upgrade:           150,   // her PC yükseltme
  decoration:            80,   // kozmetik satın alma
  first_purchase:       200,   // ilk satın alma (tek seferlik)

  // Sosyal & leaderboard (Dev 3 tetikler)
  leaderboard_top10:    500,   // haftalık top 10'a girince
  rank_improvement:     200,   // geçen haftaya göre sıralama yükselince

  // Başarı & proje
  achievement:          200,   // achievement açınca
  project_completion:   100,   // proje validate edilince

  // Toplam logtime milestones (tek seferlik, Dev 3 tetikler)
  logtime_100h:         800,
  logtime_500h:        3000,
  logtime_1000h:       8000,

  // Level atlama
  level_up_gift:         50,   // her level atlamada (sonraki seviye için motivasyon)
};

// Sabit coin bonusları
export const ACHIEVEMENT_BONUS = 300;
export const PROJECT_COMPLETION_BONUS = 500;

// Streak milestone eşikleri — sıralı kontrol için
export const STREAK_MILESTONES = [
  { days: 3,  xp_key: "streak_3"  },
  { days: 7,  xp_key: "streak_7"  },
  { days: 14, xp_key: "streak_14" },
  { days: 30, xp_key: "streak_30" },
];

export { getMultiplier };
