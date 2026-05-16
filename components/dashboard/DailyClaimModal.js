"use client";

import { motion } from "framer-motion";

export default function DailyClaimModal({ result, onClose }) {
  const { coinsEarned, error, logtimeDate, logtimeHours, multiplier, newStreak } = result;

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="nes-container is-dark max-w-sm w-full"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="nes-text is-primary text-xs mb-4">Daily Claim!</p>
        {error ? (
          <p className="nes-text is-error text-xs leading-loose">{error}</p>
        ) : (
          <div className="flex flex-col gap-2 text-xs leading-loose">
            <p className="nes-text">
              {logtimeDate} kampüs süresi{" "}
              <span className="is-warning">{logtimeHours.toFixed(1)} saat</span>.
            </p>
            <p className="nes-text">
              <span className="is-warning">x{multiplier.toFixed(1)}</span> çarpan eklendi...
            </p>
            <p className="nes-text is-success">
              +{coinsEarned} LogCoin kazandın!
            </p>
            <p className="nes-text">
              Seri: <span className="is-primary">{newStreak} gün</span>
            </p>
          </div>
        )}
        <button
          type="button"
          className="nes-btn is-primary mt-4 text-xs"
          onClick={onClose}
        >
          Harika!
        </button>
      </motion.div>
    </motion.div>
  );
}
