"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import PixelSprite from "@/components/ui/PixelSprite";
import { MARKET_CATALOG } from "@/lib/economy";

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
  { id: "g1", x: 82, y: 41 },
  { id: "g2", x: 74, y: 25 },
  { id: "g3", x: 76, y: 50 },
  { id: "g4", x: 88, y: 55 },
  { id: "g5", x: 74, y: 68 },
  { id: "g5", x: 74, y: 88 },
  { id: "g6", x: 82, y: 80 },
  { id: "g7", x: 82, y: 60 },
];

// MARKET_CATALOG'dan deco pozisyonuna yerleştirilebilecek kozmetikleri çıkar
const DECO_CATALOG = MARKET_CATALOG.filter(
  (item) => item.category === "cosmetic" && item.variantOf !== "table",
);

// item_id → katalog item eşleştirmesi (hızlı arama için)
const DECO_CATALOG_MAP = new Map(DECO_CATALOG.map((item) => [item.id, item]));

/* ── Bir deco item'ın önizleme görselini render eder ──
   Katalogda `image` varsa <img>, `sprite` varsa <PixelSprite> kullanılır.
────────────────────────────────────────────────────────────────────────── */
function DecoItemPreview({ itemId, size = 32 }) {
  const catalogItem = DECO_CATALOG_MAP.get(itemId);
  if (!catalogItem) return null;

  if (catalogItem.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={catalogItem.image}
        alt={catalogItem.name}
        draggable={false}
        style={{
          width: size,
          height: size,
          imageRendering: "pixelated",
          objectFit: "contain",
        }}
      />
    );
  }

  if (catalogItem.sprite) {
    return <PixelSprite name={catalogItem.sprite} scale={2} />;
  }

  return null;
}

/* ── Deco grid: tıklanabilir nokta butonları ──
   Yerleştirilmiş item varsa önizlemesini gösterir, yoksa "+" işareti.
────────────────────────────────────────────────────────────────────────── */
function DecoGrid({ decoState, onDecoClick }) {
  return (
    <>
      {DECO_POSITIONS.map(({ id, x, y }) => {
        const placedItemId = decoState[id];
        const catalogItem = placedItemId
          ? DECO_CATALOG_MAP.get(placedItemId)
          : null;

        return (
          // Wrapper: konum + ortalama — motion transform'u ezmesin
          <div
            key={id}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              zIndex: Math.floor(y) + 3,
            }}
          >
            <motion.button
              onClick={() => onDecoClick(id)}
              whileHover={{ scale: 1.2, filter: "brightness(1.3)" }}
              whileTap={{ scale: 0.9 }}
              title={placedItemId ? catalogItem?.name : "Dekorasyon ekle"}
              style={{
                width: 28,
                height: 28,
                background: placedItemId ? "transparent" : "rgba(0,0,0,0.45)",
                border: placedItemId
                  ? "none"
                  : "2px dashed rgba(255,255,255,0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                outline: "none",
                imageRendering: "pixelated",
              }}
            >
              {placedItemId ? (
                <DecoItemPreview itemId={placedItemId} size={26} />
              ) : (
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 14,
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
              )}
            </motion.button>
          </div>
        );
      })}
    </>
  );
}

/* ── Deco Picker Modal ──
   Envanterdeki deco-yerleştirilebilir kozmetikleri listeler.
   Bir item seçilince o pozisyona yerleştirilir.
   Pozisyonda zaten item varsa "Kaldır" butonu görünür.
────────────────────────────────────────────────────────────────────────── */
function DecoPickerModal({
  isOpen,
  positionId,
  currentItemId,
  ownedDecoIds,
  decoState,
  onClose,
  onPick,
  onRemove,
}) {
  // Başka pozisyonlarda zaten kullanılan item ID'leri (mevcut pozisyon hariç)
  const usedElsewhere = new Set(
    Object.entries(decoState ?? {})
      .filter(([pos]) => pos !== positionId)
      .map(([, itemId]) => itemId),
  );

  // Envanterdeki, kullanılabilir (başka yerde takılı olmayan) item'lar
  const availableItems = DECO_CATALOG.filter(
    (item) => ownedDecoIds.includes(item.id) && !usedElsewhere.has(item.id),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="nes-container is-rounded is-dark flex flex-col gap-4 p-6 max-w-sm w-full mx-4 relative bg-[#212529]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-2 right-4 text-g42-gray hover:text-white transition-colors"
            >
              x
            </button>

            <h2 className="text-lg text-center">Dekorasyon Seç</h2>
            <p className="text-xs text-g42-gray text-center -mt-2">
              Pozisyon: <span className="text-white">{positionId}</span>
            </p>

            {availableItems.length === 0 ? (
              <p className="text-center text-sm text-g42-gray py-4">
                Envanterinde yerleştirilebilir kozmetik yok.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableItems.map((item) => {
                  const isActive = currentItemId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={item.name}
                      onClick={() => onPick(item.id)}
                      className={`flex flex-col items-center gap-1 p-2 border-[2px] transition-none ${
                        isActive
                          ? "border-white bg-white/10"
                          : "border-transparent hover:border-g42-gray"
                      }`}
                    >
                      <DecoItemPreview itemId={item.id} size={32} />
                      <span className="text-[8px] text-g42-gray leading-none text-center truncate w-full">
                        {item.variantLabel ?? item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pozisyonda zaten bir item varsa "Kaldır" butonu görünsün */}
            {currentItemId && (
              <button
                type="button"
                className="nes-btn is-error w-full text-sm"
                onClick={onRemove}
              >
                Kaldır
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const [pos, setPos] = useState(null);
  const [moving, setMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const remainingPath = useRef([]);
  const currentStop = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Sadece client-side (tarayıcıda) mount olduktan sonra random üret
    const initStopId = STOP_IDS[Math.floor(Math.random() * STOP_IDS.length)];
    currentStop.current = initStopId;
    const initNode = GRAPH[initStopId];
    setPos({ x: initNode.x, y: initNode.y });

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

  if (!pos) return null;

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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
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

export default function ClusterMap({ inventory = [], decoplacements = {} }) {
  const router = useRouter();
  const ownedIds = normalizeInventory(inventory);
  // Envanterdeki masa renk varyasyonlarını filtrele
  const ownedTableIds = ownedIds.filter((id) => TABLE_IMAGE_MAP[id]);
  // Envanterdeki deco-yerleştirilebilir kozmetik ID'leri
  const ownedDecoIds = ownedIds.filter((id) => DECO_CATALOG_MAP.has(id));

  // Sayfa yüklendiğinde DB'deki equipped rengi bul, başlangıç değeri olarak kullan
  const initialTableColor =
    (inventory ?? []).find(
      (item) => TABLE_IMAGE_MAP[item?.id] && item?.is_equipped,
    )?.id ?? null;
  const [tableColor, setTableColor] = useState(initialTableColor);

  // Deco yerleştirme state'i — prop'tan başlat, prop değişince güncelle
  const [decoState, setDecoState] = useState(decoplacements ?? {});
  useEffect(() => {
    setDecoState(decoplacements ?? {});
  }, [decoplacements]);

  // Seçili deco pozisyonu (modal için)
  const [selectedDecoPos, setSelectedDecoPos] = useState(null);

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

  // Deco pozisyonuna item yerleştirir veya kaldırır (optimistik)
  async function handleDecoPick(positionId, itemId) {
    const previousState = decoState;
    // Optimistik güncelleme
    const newState = { ...decoState };
    if (itemId != null) {
      newState[positionId] = itemId;
    } else {
      delete newState[positionId];
    }
    setDecoState(newState);
    setSelectedDecoPos(null);

    const res = await fetch("/api/inventory/deco", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionId, itemId: itemId ?? null }),
    });

    if (!res.ok) {
      // Hata durumunda eski state'e geri dön
      setDecoState(previousState);
    }
  }

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
      <DecoGrid
        decoState={decoState}
        onDecoClick={(posId) => setSelectedDecoPos(posId)}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/cluster/arbor.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: "absolute",
          left: "82%",
          top: "36%",
          transform: "translate(-50%, -50%)",
          width: "10%",
          imageRendering: "pixelated",
          zIndex: 36,
        }}
      />

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
        ownedTableIds={ownedTableIds}
        currentTableColor={tableColor}
        onColorChange={handleColorChange}
      />

      {/* Deco pozisyonu seçici modal */}
      <DecoPickerModal
        isOpen={!!selectedDecoPos}
        positionId={selectedDecoPos}
        currentItemId={selectedDecoPos ? decoState[selectedDecoPos] : null}
        ownedDecoIds={ownedDecoIds}
        decoState={decoState}
        onClose={() => setSelectedDecoPos(null)}
        onPick={(itemId) => handleDecoPick(selectedDecoPos, itemId)}
        onRemove={() => handleDecoPick(selectedDecoPos, null)}
      />
    </div>
  );
}
