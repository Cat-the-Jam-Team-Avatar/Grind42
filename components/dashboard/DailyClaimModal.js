"use client";

import { motion } from "framer-motion";
import { CoinIcon } from "@/components/ui/PixelSprite";

/* ── Formatters ──────────────────────────────────────────────────────────── */

function formatClaimHours(hours) {
  return Number.isFinite(hours) ? hours.toFixed(1) : "0.0";
}

function formatClaimCoins(coins) {
  return Number(coins ?? 0).toLocaleString("tr-TR");
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function InfoCard({ label, value }) {
  return (
    <div className="text-center p-3 border-[3px] border-g42-line bg-g42-paper-2">
      <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">
        {label}
      </p>
      <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink text-[18px]">
        {value}
      </p>
    </div>
  );
}

function CoinReward({ coins, newStreak, xpEarned }) {
  return (
    <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] text-center">
      <div className="inline-flex items-center justify-center gap-3">
        <CoinIcon size={28} />
        <p className="text-g42-ink font-[var(--font-silkscreen),monospace] text-[clamp(24px,4vw,36px)] leading-[1.05]">
          +{coins} LC
        </p>
      </div>
      <p className="mt-2 text-[18px] text-g42-ink-soft">
        Yeni seri: {newStreak} gün
      </p>
      {xpEarned > 0 && (
        <p className="mt-1 font-[var(--font-silkscreen),monospace] text-[14px] text-g42-accent-2">
          +{xpEarned} XP
        </p>
      )}
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <p className="nes-text is-error text-xs leading-loose">{message}</p>
  );
}

function SuccessContent({ result }) {
  const { coinsEarned, isOnlineInCluster, logtimeDate, logtimeHours, multiplier, newStreak, xpEarned } = result;

  return (
    <div className="flex flex-col gap-4">
      {isOnlineInCluster === false && (
        <p className="nes-text is-warning text-xs text-center leading-loose">
          ⚠️ Cluster&apos;da online değilsin — 0.3x ceza çarpanı uygulandı ve streak sıfırlandı.
        </p>
      )}
      <div className={`grid gap-[10px] max-[560px]:grid-cols-1 ${xpEarned > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
        <InfoCard label="Tarih" value={logtimeDate} />
        <InfoCard label="Süre" value={`${formatClaimHours(logtimeHours)}s`} />
        <InfoCard label="Çarpan" value={`x${multiplier.toFixed(1)}`} />
        {xpEarned > 0 && (
          <InfoCard label="XP" value={`+${xpEarned}`} />
        )}
      </div>
      <CoinReward coins={formatClaimCoins(coinsEarned)} newStreak={newStreak} xpEarned={xpEarned} />
    </div>
  );
}

/* ── Animation Config ────────────────────────────────────────────────────── */

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const dialogMotion = {
  initial: { scale: 0.72, rotate: -2, opacity: 0 },
  animate: { scale: 1, rotate: 0, opacity: 1 },
  exit: { scale: 0.72, opacity: 0 },
};

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function DailyClaimModal({ result, onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/[.62]"
      {...overlayMotion}
      onClick={onClose}
    >
      <motion.div
        className="nes-container w-[min(520px,100%)] !bg-g42-paper shadow-[0_8px_0_var(--g42-line)]"
        {...dialogMotion}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px] text-center">
          Daily Claim
        </p>
        <h2 className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px] mb-4 text-center">
          Dünkü Grind Raporu
        </h2>

        {result.error ? (
          <ErrorMessage message={result.error} />
        ) : (
          <SuccessContent result={result} />
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
