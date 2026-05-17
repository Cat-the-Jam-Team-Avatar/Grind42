"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore } from "@/store/usePlayerStore";
import { CoinIcon } from "@/components/ui/PixelSprite";

function formatCoins(value) {
  return Math.floor(Number(value ?? 0)).toLocaleString("tr-TR");
}

/**
 * Live balance badge — always reads from Zustand store.
 * Seeds the store with `serverBalance` on mount as a fallback
 * (PlayerStoreHydrator is the primary hydration source).
 */
export default function LiveBalanceBadge({ serverBalance, size = "md" }) {
  const balance = usePlayerStore((s) => s.balance);
  const seeded = useRef(false);

  // Fallback seed: if store is still at 0 and server has data, seed it
  useEffect(() => {
    if (!seeded.current && serverBalance != null && serverBalance > 0) {
      seeded.current = true;
      const current = usePlayerStore.getState().balance;
      if (current === 0) {
        usePlayerStore.setState({ balance: serverBalance });
      }
    }
  }, [serverBalance]);

  const isSm = size === "sm";

  return (
    <div
      className={`flex items-center font-[var(--font-silkscreen),monospace] font-bold whitespace-nowrap border-[3px] border-g42-line bg-g42-coin shadow-[${isSm ? "2px_2px" : "3px_3px"}_0_var(--g42-line)] text-g42-coin-ink ${
        isSm
          ? "gap-[4px] px-[8px] py-[4px] text-[12px]"
          : "gap-[5px] px-[10px] py-[5px] text-[13px]"
      }`}
    >
      <CoinIcon size={isSm ? 14 : 16} />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={Math.floor(balance)}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="tabular-nums"
        >
          {formatCoins(balance)}
        </motion.span>
      </AnimatePresence>
      <span className="text-[9px] opacity-70">LC</span>
    </div>
  );
}

