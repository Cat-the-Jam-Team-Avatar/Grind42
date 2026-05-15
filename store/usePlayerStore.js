import { create } from "zustand";

export const usePlayerStore = create((set) => ({
  balance: 0,
  currentStreak: 0,
  multiplier: 1.0,
  claimedToday: false,
  weeklyCoins: 0,
  totalCoins: 0,

  setPlayer: (player) =>
    set({
      balance: player.balance,
      currentStreak: player.current_streak,
      multiplier: player.multiplier,
      claimedToday: player.claimed_today,
      weeklyCoins: player.weekly_coins,
      totalCoins: player.total_coins,
    }),

  addCoins: (amount) =>
    set((state) => ({
      balance: state.balance + amount,
      weeklyCoins: state.weeklyCoins + amount,
      totalCoins: state.totalCoins + amount,
    })),

  setClaimed: () => set({ claimedToday: true }),

  deductCoins: (amount) =>
    set((state) => ({ balance: Math.max(0, state.balance - amount) })),
}));
