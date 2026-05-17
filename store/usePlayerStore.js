import { create } from "zustand";
import {
  getMultiplier, calcEarnings, calcUpgradeCost, calcClickPower,
  calcComboMultiplier, calcComboDecayMs, calcPlayerLevel, xpForNextLevel,
  xpProgressInLevel, XP_SOURCES, STREAK_MILESTONES, PC_MAX_LEVEL,
  CLICK_WINDOW_MAX, CLICK_WINDOW_HOURS,
} from "@/lib/economy";

const USE_MOCK = true;

// ── Batch sync config ─────────────────────────────────────────────────────
const FLUSH_DEBOUNCE_MS = 3000; // Wait 3s of inactivity before syncing to DB

const MOCK_PLAYER = {
  id: "mock-user-1",
  intra_login: "jdoe",
  display_name: "John Doe",
  balance: 4200,
  current_streak: 3,
  pc_level: 2,
  xp: 450,
  total_clicks: 0,
  claimed_today: false,
  streak_frozen_until: null,
  last_claim_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // yesterday
  streak_started_at: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), // 3 days ago
  weekly_coins: 1800,
  total_coins: 12000,
  streak_milestone_reached: 1, // en yüksek ulaşılan milestone index (0=hiç)
  first_purchase_done: false,
};

const MOCK_CLAIM_RESULT = {
  coinsEarned: 875,
  logMinutes: 312,
  multiplier: 1.4,
  newStreak: 4,
  xpEarned: 50,
};

export const usePlayerStore = create((set, get) => ({
  id: null,
  intra_login: null,
  display_name: null,
  balance: 0,
  current_streak: 0,
  pc_level: 0,
  xp: 0,
  total_clicks: 0,
  claimed_today: false,
  streak_frozen_until: null,
  weekly_coins: 0,
  total_coins: 0,
  streak_milestone_reached: 0,
  first_purchase_done: false,
  last_claim_date: null,
  streak_started_at: null,
  // click window
  session_clicks: 0,
  click_locked_until: null,
  first_click_today: false,
  // combo
  combo_count: 0,
  combo_multiplier: 1,
  max_combo_xp_earned: false,
  _combo_reset_timer: null,
  // Batch sync tracking
  _unsaved_click_coins: 0,
  _unsaved_click_xp: 0,
  _unsaved_click_count: 0,
  _flush_timer: null,

  loadPlayer: async () => {
    if (USE_MOCK) { get().setPlayer(MOCK_PLAYER); return; }
    const { createBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (data) get().setPlayer(data);
  },

  setPlayer: (data) =>
    set({
      id: data.id,
      intra_login: data.intra_login,
      display_name: data.display_name,
      balance: data.balance ?? 0,
      current_streak: data.current_streak ?? 0,
      pc_level: data.pc_level ?? 0,
      xp: data.xp ?? 0,
      total_clicks: data.total_clicks ?? 0,
      claimed_today: data.claimed_today ?? false,
      streak_frozen_until: data.streak_frozen_until ?? null,
      weekly_coins: data.weekly_coins ?? 0,
      total_coins: data.total_coins ?? 0,
      streak_milestone_reached: data.streak_milestone_reached ?? 0,
      first_purchase_done: data.first_purchase_done ?? false,
      last_claim_date: data.last_claim_date ?? null,
      streak_started_at: data.streak_started_at ?? null,
    }),

  // XP ekle + level atlama hediyesini otomatik ver
  addXp: (amount) => {
    const { xp } = get();
    const levelBefore = calcPlayerLevel(xp);
    const newXp = xp + amount;
    const levelAfter = calcPlayerLevel(newXp);
    const levelUps = levelAfter - levelBefore;
    const giftXp = levelUps > 0 ? levelUps * XP_SOURCES.level_up_gift : 0;
    set({ xp: newXp + giftXp });
    return { levelUps, newLevel: levelAfter };
  },

  claimDaily: async () => {
    if (get().claimed_today) return { error: "Already claimed today" };

    if (USE_MOCK) {
      const today = new Date().toISOString().slice(0, 10);
      set((s) => ({
        balance: s.balance + MOCK_CLAIM_RESULT.coinsEarned,
        weekly_coins: s.weekly_coins + MOCK_CLAIM_RESULT.coinsEarned,
        total_coins: s.total_coins + MOCK_CLAIM_RESULT.coinsEarned,
        current_streak: MOCK_CLAIM_RESULT.newStreak,
        claimed_today: true,
        first_click_today: false,
        last_claim_date: today,
        streak_started_at: MOCK_CLAIM_RESULT.newStreak === 1 ? today : s.streak_started_at,
      }));
      get().addXp(MOCK_CLAIM_RESULT.xpEarned);
      return MOCK_CLAIM_RESULT;
    }

    const res = await fetch("/api/claim", { method: "POST" });
    const data = await res.json();
    if (!res.ok) return { error: data.error };

    const hour = new Date().getHours();
    const timeXp = hour >= 8 && hour < 10 ? XP_SOURCES.early_bird
                 : hour >= 22             ? XP_SOURCES.night_owl
                 : 0;

    const newStreak = data.newStreak;
    const milestoneXp = STREAK_MILESTONES.reduce((acc, m, i) => {
      const alreadyClaimed = get().streak_milestone_reached > i;
      return (!alreadyClaimed && newStreak >= m.days)
        ? acc + XP_SOURCES[m.xp_key]
        : acc;
    }, 0);
    const newMilestoneReached = STREAK_MILESTONES.reduce((acc, m, i) =>
      newStreak >= m.days ? i + 1 : acc, get().streak_milestone_reached);

    set((s) => ({
      balance: s.balance + data.coinsEarned,
      weekly_coins: s.weekly_coins + data.coinsEarned,
      total_coins: s.total_coins + data.coinsEarned,
      current_streak: newStreak,
      claimed_today: true,
      first_click_today: false,
      streak_milestone_reached: newMilestoneReached,
    }));

    const totalXp = (data.xpEarned ?? XP_SOURCES.daily_claim) + timeXp + milestoneXp;
    get().addXp(totalXp);
    return { ...data, xpEarned: totalXp };
  },

  clickCampus: () => {
    const {
      streak_frozen_until, session_clicks, click_locked_until,
      combo_count, _combo_reset_timer, xp, total_clicks,
      max_combo_xp_earned, first_click_today,
    } = get();

    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    if (streak_frozen_until && streak_frozen_until >= today)
      return { frozen: true, earned: 0 };

    if (click_locked_until && now < click_locked_until)
      return { locked: true, earned: 0, unlocksAt: click_locked_until };

    const playerLevel = calcPlayerLevel(xp);
    const newCombo = combo_count + 1;
    const comboMult = calcComboMultiplier(newCombo);
    const earned = calcClickPower(playerLevel) * comboMult;
    const newSessionClicks = session_clicks + 1;
    const newTotalClicks = total_clicks + 1;

    let xpGained = 0;
    if (!first_click_today) xpGained += XP_SOURCES.first_daily_click;
    if (newTotalClicks % 500 === 0) xpGained += XP_SOURCES.click_milestone;
    if (newCombo === 75 && !max_combo_xp_earned) xpGained += XP_SOURCES.max_combo;

    const isWindowFull = newSessionClicks >= CLICK_WINDOW_MAX;
    const lockUntil = isWindowFull ? now + CLICK_WINDOW_HOURS * 60 * 60 * 1000 : null;

    if (_combo_reset_timer) clearTimeout(_combo_reset_timer);
    const decayMs = calcComboDecayMs(playerLevel);
    const timer = setTimeout(() => {
      set({ combo_count: 0, combo_multiplier: 1, _combo_reset_timer: null, max_combo_xp_earned: false });
    }, decayMs);

    set((s) => ({
      balance: s.balance + earned,
      total_coins: s.total_coins + earned,
      weekly_coins: s.weekly_coins + earned,
      total_clicks: newTotalClicks,
      session_clicks: isWindowFull ? 0 : newSessionClicks,
      click_locked_until: lockUntil,
      first_click_today: true,
      combo_count: newCombo,
      combo_multiplier: comboMult,
      max_combo_xp_earned: newCombo >= 75 ? true : s.max_combo_xp_earned,
      _combo_reset_timer: timer,
      // Accumulate unsaved earnings for batch sync
      _unsaved_click_coins: s._unsaved_click_coins + earned,
      _unsaved_click_xp: s._unsaved_click_xp + xpGained,
      _unsaved_click_count: s._unsaved_click_count + 1,
    }));

    if (xpGained > 0) get().addXp(xpGained);

    // Schedule a debounced flush (or flush immediately if window is full)
    if (isWindowFull) {
      get().flushClickEarnings();
    } else {
      get()._scheduleFlush();
    }

    return { earned, combo: newCombo, multiplier: comboMult, xpGained, locked: isWindowFull };
  },

  purchaseUpgrade: async () => {
    const { pc_level, balance, first_purchase_done } = get();
    const cost = calcUpgradeCost(pc_level);
    if (cost === null) return { error: "Maksimum seviyeye ulaşıldı" };
    if (balance < cost) return { error: "Yetersiz bakiye" };

    const xpGained = XP_SOURCES.pc_upgrade + (!first_purchase_done ? XP_SOURCES.first_purchase : 0);

    if (USE_MOCK) {
      set((s) => ({
        pc_level: s.pc_level + 1,
        balance: s.balance - cost,
        first_purchase_done: true,
      }));
      get().addXp(xpGained);
      return { success: true, new_pc_level: pc_level + 1, cost, xpGained };
    }

    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: "pc_upgrade" }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };

    set((s) => ({
      pc_level: data.new_pc_level,
      balance: s.balance - cost,
      first_purchase_done: true,
    }));
    get().addXp(xpGained);
    return { ...data, xpGained };
  },

  deductBalance: (amount) =>
    set((s) => ({ balance: Math.max(0, s.balance - amount) })),

  // ── Batch sync ────────────────────────────────────────────────────────
  _scheduleFlush: () => {
    const { _flush_timer } = get();
    if (_flush_timer) clearTimeout(_flush_timer);
    const timer = setTimeout(() => {
      get().flushClickEarnings();
    }, FLUSH_DEBOUNCE_MS);
    set({ _flush_timer: timer });
  },

  flushClickEarnings: async () => {
    const { _unsaved_click_coins, _unsaved_click_xp, _unsaved_click_count, _flush_timer, id } = get();

    // Nothing to flush
    if (_unsaved_click_coins === 0 && _unsaved_click_xp === 0) return;

    if (_flush_timer) clearTimeout(_flush_timer);

    // Snapshot and reset unsaved counters immediately (optimistic)
    const coinsToSync = _unsaved_click_coins;
    const xpToSync = _unsaved_click_xp;
    const clicksToSync = _unsaved_click_count;

    set({
      _unsaved_click_coins: 0,
      _unsaved_click_xp: 0,
      _unsaved_click_count: 0,
      _flush_timer: null,
    });

    // If user is not a real DB user (mock), just log — don't hit the API
    const isMockUser = !id || id === "mock-user-1";
    if (isMockUser) {
      console.log(`[ClickSync] Flushed ${clicksToSync} clicks: +${coinsToSync.toFixed(1)} coins, +${xpToSync} XP (mock, not saved)`);
      return;
    }

    // Real sync to database
    try {
      await fetch("/api/clicks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coins: coinsToSync,
          xp: xpToSync,
          clicks: clicksToSync,
        }),
      });
    } catch (err) {
      // On failure, add the unsaved amounts back so they'll be retried
      console.error("[ClickSync] Failed to sync, will retry:", err);
      set((s) => ({
        _unsaved_click_coins: s._unsaved_click_coins + coinsToSync,
        _unsaved_click_xp: s._unsaved_click_xp + xpToSync,
        _unsaved_click_count: s._unsaved_click_count + clicksToSync,
      }));
      get()._scheduleFlush();
    }
  },

  // Selectors
  getPlayerLevel: () => calcPlayerLevel(get().xp),
  getXpProgress: () => xpProgressInLevel(get().xp),
  getXpForNextLevel: () => xpForNextLevel(calcPlayerLevel(get().xp)),
  getCurrentMultiplier: () => getMultiplier(get().current_streak),
  getHourlyRate: () => calcEarnings(60, 1, get().pc_level),
  canAfford: () => {
    const { pc_level, balance } = get();
    const cost = calcUpgradeCost(pc_level);
    return cost !== null && balance >= cost;
  },
  isMaxPcLevel: () => get().pc_level >= PC_MAX_LEVEL,
  nextUpgradeCost: () => calcUpgradeCost(get().pc_level),
  isClickLocked: () => {
    const { click_locked_until } = get();
    return click_locked_until !== null && Date.now() < click_locked_until;
  },
}));

// ── Page unload flush ───────────────────────────────────────────────────
if (typeof window !== "undefined") {
  const flush = () => usePlayerStore.getState().flushClickEarnings();

  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
