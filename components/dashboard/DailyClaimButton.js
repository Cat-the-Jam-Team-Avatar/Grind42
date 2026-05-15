"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DailyClaimModal from "./DailyClaimModal";

export default function DailyClaimButton({ claimed }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [result, setResult] = useState(null);

  async function handleClaim() {
    const res = await fetch("/api/claim", { method: "POST" });
    const data = await res.json();
    setResult(data);
    setModalOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className={`nes-btn ${claimed ? "is-disabled" : "is-warning"}`}
        disabled={claimed}
        onClick={handleClaim}
      >
        {claimed ? "Bugün Alındı ✓" : "Günlük Claim"}
      </button>

      <AnimatePresence>
        {modalOpen && result && (
          <DailyClaimModal result={result} onClose={() => setModalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
