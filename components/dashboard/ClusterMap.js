"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

function TableGrid({ desks, onDeskClick, tableColor }) {
  // Tüm masalar için global renk — varsayılan beyaz
  const tableImg =
    TABLE_IMAGE_MAP[tableColor] ??
    "/cluster/market/cosmetic/table/table-white.png";

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
                  src={tableImg}
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

// x < 62 = cluster içi, x > 64 = bahçe/teras
// Varyant grupları aynı pozisyonu paylaşır — yalnızca ilk sahip olunan gösterilir
const ITEM_POSITIONS = {
  // Sol kenar (x=3)
  rubber_duck:           { x: 3,  y: 28 },
  toilet_paper:          { x: 3,  y: 50 },
  sleeping_cat_black:    { x: 3,  y: 70 },
  sleeping_cat_brown:    { x: 3,  y: 70 },
  sleeping_cat_cream:    { x: 3,  y: 70 },
  sleeping_cat_orange:   { x: 3,  y: 70 },
  sleeping_cat_white:    { x: 3,  y: 70 },
  // Sağ kenar (x=60)
  lampshade_1:           { x: 60, y: 76 },
  lampshade_2:           { x: 60, y: 76 },
  lampshade_3:           { x: 60, y: 76 },
  skull_1:               { x: 60, y: 28 },
  skull_2:               { x: 60, y: 28 },
  skull_3:               { x: 60, y: 28 },
  skull_4:               { x: 60, y: 28 },
  dancing_cat:           { x: 60, y: 44 },
  dancing_frog:          { x: 60, y: 60 },
  // Bahçe/teras (x > 65)
  vase_blue_barrel_1:    { x: 72, y: 48 },
  vase_blue_barrel_2:    { x: 72, y: 48 },
  vase_blue_barrel_3:    { x: 72, y: 48 },
  vase_blue_barrel_4:    { x: 72, y: 48 },
  vase_plastic_bucket_1: { x: 72, y: 65 },
  vase_plastic_bucket_2: { x: 72, y: 65 },
  vase_plastic_bucket_3: { x: 72, y: 65 },
  vase_plastic_bucket_4: { x: 72, y: 65 },
  vase_toilet_1:         { x: 72, y: 80 },
  vase_toilet_2:         { x: 72, y: 80 },
  vase_toilet_3:         { x: 72, y: 80 },
  vase_toilet_4:         { x: 72, y: 80 },
};

// Varyant grupları: aynı grup içinde yalnızca ilk sahip olunan render edilir
const VARIANT_GROUPS = {
  sleeping_cat: ["sleeping_cat_black","sleeping_cat_brown","sleeping_cat_cream","sleeping_cat_orange","sleeping_cat_white"],
  skull:        ["skull_1","skull_2","skull_3","skull_4"],
  lampshade:    ["lampshade_1","lampshade_2","lampshade_3"],
  vase_blue_barrel:    ["vase_blue_barrel_1","vase_blue_barrel_2","vase_blue_barrel_3","vase_blue_barrel_4"],
  vase_plastic_bucket: ["vase_plastic_bucket_1","vase_plastic_bucket_2","vase_plastic_bucket_3","vase_plastic_bucket_4"],
  vase_toilet:         ["vase_toilet_1","vase_toilet_2","vase_toilet_3","vase_toilet_4"],
};

const IMAGE_MAP = {
  rubber_duck:           "/cluster/market/cosmetic/duck.png",
  toilet_paper:          "/cluster/market/cosmetic/toilet_paper.png",
  sleeping_cat_black:    "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-black.png",
  sleeping_cat_brown:    "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-brown.png",
  sleeping_cat_cream:    "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-cream.png",
  sleeping_cat_orange:   "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-orange.png",
  sleeping_cat_white:    "/cluster/market/cosmetic/sleeping-cat/sleeping-cat-white.png",
  lampshade_1:           "/cluster/market/cosmetic/lampshade/lampshade-1.png",
  lampshade_2:           "/cluster/market/cosmetic/lampshade/lampshade-2.png",
  lampshade_3:           "/cluster/market/cosmetic/lampshade/lampshade-3.png",
  skull_1:               "/cluster/market/cosmetic/skull/skull-1.png",
  skull_2:               "/cluster/market/cosmetic/skull/skull-2.png",
  skull_3:               "/cluster/market/cosmetic/skull/skull-3.png",
  skull_4:               "/cluster/market/cosmetic/skull/skull-4.png",
  dancing_cat:           "/cluster/market/cosmetic/dancing/dancing-cat.gif",
  dancing_frog:          "/cluster/market/cosmetic/dancing/dancing-frog.gif",
  vase_blue_barrel_1:    "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-1.png",
  vase_blue_barrel_2:    "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-2.png",
  vase_blue_barrel_3:    "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-3.png",
  vase_blue_barrel_4:    "/cluster/market/cosmetic/vase/vase-blue-barrel/vase-blue-barrel-4.png",
  vase_plastic_bucket_1: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-1.png",
  vase_plastic_bucket_2: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-2.png",
  vase_plastic_bucket_3: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-3.png",
  vase_plastic_bucket_4: "/cluster/market/cosmetic/vase/vase-plastic-bucket/vase-plastic-bucket-4.png",
  vase_toilet_1:         "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-1.png",
  vase_toilet_2:         "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-2.png",
  vase_toilet_3:         "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-3.png",
  vase_toilet_4:         "/cluster/market/cosmetic/vase/vase-toilet/vase-toilet-4.png",
};

// Envanterdeki masa renk varyasyonlarını resme eşler
const TABLE_IMAGE_MAP = {
  table_blue: "/cluster/market/cosmetic/table/table-blue.png",
  table_pink: "/cluster/market/cosmetic/table/table-pink.png",
  table_white: "/cluster/market/cosmetic/table/table-white.png",
};

const TABLE_LABELS = {
  table_blue: "Mavi",
  table_pink: "Pembe",
  table_white: "Beyaz",
};

function MapItem({ itemId, pos }) {
  const imageSrc = IMAGE_MAP[itemId];
  if (!imageSrc) return null;
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: 24, imageRendering: "pixelated" }}
      />
    </div>
  );
}

// Varyant gruplarını tekilleştirir: her gruptan yalnızca ilk sahip olunan gösterilir
function deduplicateVariants(ownedIds) {
  const seen = new Set();
  return ownedIds.filter((id) => {
    for (const members of Object.values(VARIANT_GROUPS)) {
      if (members.includes(id)) {
        const key = members[0]; // grubun temsil anahtarı
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }
    }
    return true; // varyant grubu üyesi değil, her zaman göster
  });
}

/* ── Desk Modal ── */

function DeskActionModal({
  isOpen,
  deskId,
  deskData,
  onClose,
  onBuy,
  onUpgrade,
  ownedTableIds,
  currentTableColor,
  onColorChange,
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

            {/* Masa rengi picker — sadece envanterde en az bir renk varsa göster */}
            {ownedTableIds?.length > 0 && (
              <div className="w-full">
                <p className="text-xs text-g42-gray mb-2 text-center">
                  Masa Rengi
                </p>
                <div className="flex justify-center gap-2">
                  {ownedTableIds.map((colorId) => {
                    // Renk seçilmemişse varsayılan beyaz aktif kabul edilir
                    const effectiveColor = currentTableColor ?? "table_white";
                    const isActive = effectiveColor === colorId;
                    return (
                      <button
                        key={colorId}
                        type="button"
                        title={TABLE_LABELS[colorId]}
                        onClick={() => onColorChange(colorId)}
                        className={`border-[3px] p-[2px] transition-none ${
                          isActive
                            ? "border-white"
                            : "border-transparent hover:border-g42-gray"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={TABLE_IMAGE_MAP[colorId]}
                          alt={TABLE_LABELS[colorId]}
                          draggable={false}
                          style={{
                            width: 32,
                            height: 32,
                            imageRendering: "pixelated",
                            objectFit: "contain",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
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
  const router = useRouter();
  const ownedIds = normalizeInventory(inventory);
  // Envanterdeki masa renk varyasyonlarını filtrele
  const ownedTableIds = ownedIds.filter((id) => TABLE_IMAGE_MAP[id]);

  // Sayfa yüklendiğinde DB'deki equipped rengi bul, başlangıç değeri olarak kullan
  const initialTableColor =
    (inventory ?? []).find(
      (item) => TABLE_IMAGE_MAP[item?.id] && item?.is_equipped,
    )?.id ?? null;
  const [tableColor, setTableColor] = useState(initialTableColor);

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

  // Seçilen masa rengini optimistik günceller ve DB'ye kaydeder
  async function handleColorChange(colorId) {
    setTableColor(colorId);
    await fetch("/api/inventory/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: colorId }),
    });
    router.refresh();
  }

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

      <TableGrid
        desks={desks}
        onDeskClick={handleDeskClick}
        tableColor={tableColor}
      />
      <DecoGrid />

      {deduplicateVariants(ownedIds).map((id) => {
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
        ownedTableIds={ownedTableIds}
        currentTableColor={tableColor}
        onColorChange={handleColorChange}
      />
    </div>
  );
}
