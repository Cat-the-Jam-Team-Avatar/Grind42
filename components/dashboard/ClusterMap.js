"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PixelSprite from "@/components/ui/PixelSprite";

/* ──────────────────────────────────────────────────────────────────────────
   Koordinat sistemi (container'ın %'si)

   COR_Y  yatay koridorlar   → [13, 30, 45, 60, 75]
   ROW_Y  masa sıraları      → [22, 37, 52, 67, 82]
   COL_X  masa sütunları     → [6, 12.5, 19, 25.5, 38.5, 45, 51.5, 58]
   MID_X  orta dikey koridor → 32

   Karakter HEP koridor node'unda durur (masa node'u yok).
   Durma noktaları = COL_X × COR_Y  →  "masanın önü"
────────────────────────────────────────────────────────────────────────── */

const COR_Y = [30, 45, 60, 75]; // 13 kaldırıldı → karakter duvardan geçmez
const ROW_Y = [22, 37, 52, 67, 82];
const COL_X = [6, 12.5, 19, 25.5, 38.5, 45, 51.5, 58];
const MID_X = 32;
const ALL_X = [6, 12.5, 19, 25.5, MID_X, 38.5, 45, 51.5, 58];
const TABLE_W = "6%";
const STEP_MS = 300; // ms / adım → "tık tık tık" hissi

/* ── Graf ── */

function buildGraph() {
  const G = {};
  const add = (id, x, y) => {
    G[id] = { x, y, adj: [] };
  };
  const link = (a, b) => {
    if (!G[a] || !G[b]) return;
    if (!G[a].adj.includes(b)) G[a].adj.push(b);
    if (!G[b].adj.includes(a)) G[b].adj.push(a);
  };

  // Yatay koridor node'ları
  COR_Y.forEach((cy) => ALL_X.forEach((x) => add(`c_${x}_${cy}`, x, cy)));

  // Orta dikey koridor: masa sırası yüksekliklerinde ek node
  ROW_Y.forEach((ry) => add(`c_${MID_X}_${ry}`, MID_X, ry));

  // Yatay bağlantılar (her koridor satırında tüm x zinciri)
  COR_Y.forEach((cy) => {
    for (let i = 0; i < ALL_X.length - 1; i++)
      link(`c_${ALL_X[i]}_${cy}`, `c_${ALL_X[i + 1]}_${cy}`);
  });

  // Dikey bağlantılar (sadece x=32, y sıralı)
  const midIds = [
    ...COR_Y.map((y) => `c_${MID_X}_${y}`),
    ...ROW_Y.map((y) => `c_${MID_X}_${y}`),
  ].sort((a, b) => G[a].y - G[b].y);
  for (let i = 0; i < midIds.length - 1; i++) link(midIds[i], midIds[i + 1]);

  return G;
}

const GRAPH = buildGraph();

// Durma noktaları = masanın önündeki koridor pozisyonları
const STOP_IDS = COL_X.flatMap((x) => COR_Y.map((cy) => `c_${x}_${cy}`));

/* ── BFS ── */

function bfs(startId, endId) {
  if (startId === endId) return [startId];
  const queue = [[startId]];
  const visited = new Set([startId]);
  while (queue.length) {
    const path = queue.shift();
    const curr = path[path.length - 1];
    for (const nb of GRAPH[curr].adj) {
      if (nb === endId) return [...path, nb];
      if (!visited.has(nb)) {
        visited.add(nb);
        queue.push([...path, nb]);
      }
    }
  }
  return [startId];
}

/* ── Yardımcılar ── */

function pickStop(excludeId) {
  const pool = STOP_IDS.filter((id) => id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeInventory(inventory) {
  return (inventory ?? []).map((item) =>
    typeof item === "string" ? item : (item?.item_id ?? item?.id),
  );
}

/* ── Dekorasyon pozisyonları ──
   Masa (COL_X × ROW_Y) ve koridorlardan (COR_Y, x=32) uzak tutuldu.
   Bahçe: x > 64   |   Cluster çevresi: üst y≈8, sol x≈2, alt y≈92, sağ kenar x≈63
────────────────────────────────────────────────────────────────────────── */

const DECO_POSITIONS = [
  // Cluster sağ kenarı — dekor için ideal çizgi
  { id: "r2", x: 65, y: 30 },
  { id: "r3", x: 65, y: 44 },
  { id: "r4", x: 65, y: 58 },
  { id: "r5", x: 65, y: 72 },
  { id: "r6", x: 65, y: 85 },
  // Bahçe / teras iç kısım
  { id: "g2", x: 86, y: 25 },
  { id: "g3", x: 76, y: 40 },
  { id: "g4", x: 88, y: 55 },
  { id: "g5", x: 72, y: 68 },
  { id: "g6", x: 82, y: 80 },
];

function DecoGrid() {
  return (
    <>
      {DECO_POSITIONS.map(({ id, x, y }) => (
        <div
          key={id}
          title={id}
          style={{
            position: "absolute",
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
            zIndex: Math.floor(y) + 3,
            width: 14,
            height: 14,
            background: "#f5c842",
            border: "2px solid #8a6d00",
            imageRendering: "pixelated",
          }}
        />
      ))}
    </>
  );
}

/* ── Masa + bilgisayar grid'i ── */

function TableGrid({ desks, onDeskClick }) {
  return (
    <>
      {ROW_Y.map((y) =>
        COL_X.map((x) => {
          const deskId = `${x}-${y}`;
          const deskData = desks[deskId] || { hasComputer: false, level: 0 };
          return (
            <div
              key={deskId}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                width: TABLE_W,
                zIndex: Math.floor(y) + 1,
              }}
            >
              <motion.button
                onClick={() => onDeskClick(deskId, deskData)}
                whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  outline: "none",
                  display: "block",
                }}
              >
                {/* Masa */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/cluster/market/cosmetic/table/table-white.png"
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{
                    display: "block",
                    width: "100%",
                    imageRendering: "pixelated",
                  }}
                />
                {/* Bilgisayar (Eğer varsa) */}
                {deskData.hasComputer && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/computer/computerone.png"
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    style={{
                      position: "absolute",
                      top: "-30%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "55%",
                      imageRendering: "pixelated",
                    }}
                  />
                )}
              </motion.button>
            </div>
          );
        }),
      )}
    </>
  );
}

/* ── Karakter ──
   - Koridordaki bir durma noktasında (masanın önü) başlar
   - BFS ile rota hesaplanır
   - Her adım STEP_MS ms sonra anında snap eder → "tık tık tık"
   - Masaya varınca 1–3s bekler, yeni masa seçer
────────────────────────────────────────────────────────────────────────── */

function Character() {
  const [initStopId] = useState(
    () => STOP_IDS[Math.floor(Math.random() * STOP_IDS.length)],
  );

  const [pos, setPos] = useState(() => {
    const initNode = GRAPH[initStopId];
    return { x: initNode.x, y: initNode.y };
  });
  const [moving, setMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const remainingPath = useRef([]);
  const currentStop = useRef(initStopId);
  const timerRef = useRef(null);

  useEffect(() => {
    const scheduleStep = () => {
      if (remainingPath.current.length > 0) {
        const nodeId = remainingPath.current.shift();
        const { x, y } = GRAPH[nodeId];
        setPos((prev) => {
          if (x !== prev.x) setFacingLeft(x < prev.x);
          return { x, y };
        });
        setMoving(true);
        timerRef.current = setTimeout(scheduleStep, STEP_MS);
      } else {
        setMoving(false); // masaya ulaştı → idle
        const idleMs = 800 + Math.random() * 2200;
        timerRef.current = setTimeout(() => {
          const newStop = pickStop(currentStop.current);
          const path = bfs(currentStop.current, newStop);
          currentStop.current = newStop;
          remainingPath.current = path.slice(1);
          scheduleStep();
        }, idleMs);
      }
    };

    timerRef.current = setTimeout(scheduleStep, 500 + Math.random() * 500);
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: Math.floor(pos.y),
        transition: "left 180ms linear, top 180ms linear",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          moving ? "/cluster/duck/duck-walk.gif" : "/cluster/duck/duck-idle.gif"
        }
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          width: 20,
          imageRendering: "pixelated",
          transform: facingLeft ? "scaleX(-1)" : "none",
        }}
      />
    </div>
  );
}

/* ── Inventory item ── */

const ITEM_POSITIONS = {
  loba_cup: { x: 60, y: 34 },
  pixel_cat: { x: 3, y: 78 },
  ergonomic_chair: { x: 60, y: 62 },
  mech_keyboard: { x: 3, y: 20 },
  dual_monitor: { x: 60, y: 20 },
  plant: { x: 3, y: 50 },
};

const SPRITE_MAP = {
  plant: "plant",
  loba_cup: "cup",
  pixel_cat: "cat",
  ergonomic_chair: "chair",
  mech_keyboard: "keyboard",
  dual_monitor: "monitor",
};

function MapItem({ itemId, pos }) {
  const spriteName = SPRITE_MAP[itemId];
  if (!spriteName) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: Math.floor(pos.y) + 2,
      }}
    >
      <PixelSprite name={spriteName} scale={2} />
    </div>
  );
}

/* ── Desk Modal ── */

function DeskActionModal({
  isOpen,
  deskId,
  deskData,
  onClose,
  onBuy,
  onUpgrade,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="nes-container is-rounded is-dark flex flex-col items-center gap-6 p-6 max-w-sm w-full mx-4 relative bg-[#212529]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-4 text-g42-gray hover:text-white transition-colors"
            >
              x
            </button>
            <h2 className="text-xl text-center">
              {deskData?.hasComputer ? "Bilgisayarı Yükselt" : "Bilgisayar Al"}
            </h2>
            <div className="flex justify-center w-full my-2">
              {deskData?.hasComputer ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/computer/computerone.png"
                  alt="Computer"
                  style={{ width: "64px", imageRendering: "pixelated" }}
                />
              ) : (
                <PixelSprite name="chair" scale={3} />
              )}
            </div>
            {deskData?.hasComputer ? (
              <div className="text-center text-sm mb-2 text-g42-gray">
                <p>Mevcut Seviye: {deskData.level}</p>
                <p>Sonraki Seviye: {deskData.level + 1}</p>
              </div>
            ) : (
              <p className="text-center text-sm mb-2 text-g42-gray">
                Bu masa boş görünüyor. Buraya bir bilgisayar kurarak logtime
                kazanmaya başlayabilirsin!
              </p>
            )}

            <button
              type="button"
              className={`nes-btn w-full ${deskData?.hasComputer ? "is-warning" : "is-success"}`}
              onClick={() => {
                deskData?.hasComputer ? onUpgrade(deskId) : onBuy(deskId);
                onClose();
              }}
            >
              {deskData?.hasComputer ? "Yükselt" : "Satın Al"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Ana bileşen ── */

export default function ClusterMap({ inventory = [] }) {
  const ownedIds = normalizeInventory(inventory);

  // Mock State for Desks
  const [desks, setDesks] = useState({
    "12.5-37": { hasComputer: true, level: 1 },
    "25.5-52": { hasComputer: true, level: 3 },
  });

  const [selectedDesk, setSelectedDesk] = useState(null);

  const handleDeskClick = (deskId, deskData) => {
    setSelectedDesk({ id: deskId, data: deskData });
  };

  const handleBuy = (deskId) => {
    setDesks((prev) => ({
      ...prev,
      [deskId]: { hasComputer: true, level: 1 },
    }));
  };

  const handleUpgrade = (deskId) => {
    setDesks((prev) => ({
      ...prev,
      [deskId]: { ...prev[deskId], level: prev[deskId].level + 1 },
    }));
  };

  return (
    <div
      className="relative w-full overflow-hidden border-[4px] border-g42-line shadow-[0_5px_0_var(--g42-line)]"
      style={{ aspectRatio: "1698 / 926" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cluster/bg.png"
        alt="42 Cluster"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: "pixelated" }}
        draggable={false}
      />

      <TableGrid desks={desks} onDeskClick={handleDeskClick} />
      <DecoGrid />

      {ownedIds.map((id) => {
        const pos = ITEM_POSITIONS[id];
        if (!pos) return null;
        return <MapItem key={id} itemId={id} pos={pos} />;
      })}

      <Character />

      <DeskActionModal
        isOpen={!!selectedDesk}
        deskId={selectedDesk?.id}
        deskData={selectedDesk?.data}
        onClose={() => setSelectedDesk(null)}
        onBuy={handleBuy}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
