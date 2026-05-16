"use client";

import { motion } from "framer-motion";
import { CoinIcon } from "@/components/ui/PixelSprite";

export default function DailyClaimModal({ result, onClose }) {
  const { coinsEarned, error, logtimeDate, logtimeHours, multiplier, newStreak } = result;
  const formattedHours = Number.isFinite(logtimeHours) ? logtimeHours.toFixed(1) : "0.0";
  const formattedCoins = Number(coinsEarned ?? 0).toLocaleString("tr-TR");

  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/[.62]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="nes-container w-[min(520px,100%)] !bg-g42-paper shadow-[0_8px_0_var(--g42-line)]"
        initial={{ scale: 0.72, rotate: -2, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        exit={{ scale: 0.72, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px] text-center">Daily Claim</p>
        <h2 className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px] mb-4 text-center">Dünkü Grind Raporu</h2>

        {error ? (
          <p className="nes-text is-error text-xs leading-loose">{error}</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-[10px] max-[560px]:grid-cols-1">
              <div className="text-center p-3 border-[3px] border-g42-line bg-g42-paper-2">
                <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">Tarih</p>
                <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[18px]">{logtimeDate}</p>
              </div>
              <div className="text-center p-3 border-[3px] border-g42-line bg-g42-paper-2">
                <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">Süre</p>
                <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[18px]">{formattedHours}s</p>
              </div>
              <div className="text-center p-3 border-[3px] border-g42-line bg-g42-paper-2">
                <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">Çarpan</p>
                <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[18px]">x{multiplier.toFixed(1)}</p>
              </div>
            </div>

            <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] text-center">
              <div className="inline-flex items-center justify-center gap-3">
                <CoinIcon size={28} />
                <p className="text-g42-ink font-[var(--font-silkscreen),monospace] text-[clamp(24px,4vw,36px)] leading-[1.05]">+{formattedCoins} LC</p>
              </div>
              <p className="mt-2 text-[18px] text-g42-ink-soft">
                Yeni seri: {newStreak} gün
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          className="nes-btn is-primary mt-5 w-full text-xs"
          onClick={onClose}
        >
          Tamam
        </button>
      </motion.div>
    </motion.div>
  );
}
