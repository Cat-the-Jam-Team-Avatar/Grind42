"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import DailyClaimModal from "./DailyClaimModal";
import { CoinIcon } from "@/components/ui/PixelSprite";

export default function DailyClaimButton({ claimed }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleClaim() {
    setLoading(true);

    try {
      const res = await fetch("/api/claim", { method: "POST" });
      const data = await res.json();

      setResult(res.ok ? data : { error: data.error ?? "Claim tamamlanamadı." });
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
          {loading ? "Hesaplanıyor" : claimed ? "Bugün Alındı" : "Günlük Claim"}
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
