"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import DailyClaimModal from "./DailyClaimModal";
import { CoinIcon } from "@/components/ui/PixelSprite";

/* ── Claim API ───────────────────────────────────────────────────────────── */

async function performClaim() {
  const res = await fetch("/api/claim", { method: "POST" });
  const data = await res.json();

  if (!res.ok) {
    return { error: data.error ?? "Claim tamamlanamadı." };
  }

  return data;
}

/* ── Button label helper ─────────────────────────────────────────────────── */

function getButtonLabel(loading, claimed) {
  if (loading) return "Hesaplanıyor";
  if (claimed) return "Bugün Alındı";
  return "Günlük Claim";
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function DailyClaimButton({ claimed }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    setLoading(true);

    try {
      const data = await performClaim();
      setResult(data);
      setModalOpen(true);
    } catch {
      setResult({ error: "Claim isteği gönderilemedi." });
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setModalOpen(false);

    if (result && !result.error) {
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        className={`nes-btn ${claimed ? "is-disabled" : "is-warning"}`}
        disabled={claimed || loading}
        onClick={handleClaim}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {!claimed && <CoinIcon size={18} />}
          {getButtonLabel(loading, claimed)}
        </span>
      </button>

      <AnimatePresence>
        {modalOpen && result && (
          <DailyClaimModal result={result} onClose={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}
