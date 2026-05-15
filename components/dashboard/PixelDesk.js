"use client";

// Pixel desk visual — items light up based on owned inventory.
// Replace placeholder divs with actual pixel-art sprites in Phase 5.
export default function PixelDesk({ inventory }) {
  const has = (id) => inventory.includes(id);

  return (
    <div className="relative w-64 h-48 border-4 border-gray-600 bg-[#111] flex items-end justify-center">
      {/* Monitor */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 w-20 h-14 border-4 ${
          has("dual_monitor") ? "border-blue-400 bg-blue-900" : "border-gray-600 bg-gray-900"
        } flex items-center justify-center`}
      >
        <span className="nes-text text-[6px] text-center">
          {has("dual_monitor") ? "DUAL MON" : "MONITOR"}
        </span>
      </div>

      {/* Keyboard */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 w-24 h-6 border-2 ${
          has("mech_keyboard") ? "border-green-400 bg-green-900" : "border-gray-600 bg-gray-800"
        }`}
      />

      {/* Chair */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-10 border-2 ${
          has("ergonomic_chair") ? "border-yellow-400 bg-yellow-900" : "border-gray-600 bg-gray-700"
        }`}
      />

      {/* Cosmetics */}
      {has("pixel_cat") && (
        <span className="absolute bottom-14 right-4 nes-text text-[8px]">=^.^=</span>
      )}
      {has("loba_cup") && (
        <span className="absolute bottom-14 left-4 nes-text text-[8px]">[☕]</span>
      )}
    </div>
  );
}
