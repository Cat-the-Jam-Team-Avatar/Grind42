import { NextResponse } from "next/server";
import { MARKET_CATALOG } from "@/lib/economy";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Geçerli deco pozisyon ID'leri
const VALID_POSITION_IDS = new Set([
  "r2",
  "r3",
  "r4",
  "r5",
  "r6",
  "g2",
  "g3",
  "g4",
  "g5",
  "g6",
]);

// Deco pozisyonuna yerleştirilebilecek kozmetik ürün ID'leri
// (masa varyantları ve consumable'lar hariç)
const DECO_PLACEABLE_IDS = new Set(
  MARKET_CATALOG.filter(
    (item) => item.category === "cosmetic" && item.variantOf !== "table",
  ).map((item) => item.id),
);

export async function POST(request) {
  const supabase = await createServerClient();

  // Auth kontrolü
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const { positionId, itemId } = body;

  // positionId zorunlu ve geçerli olmalı
  if (!positionId || !VALID_POSITION_IDS.has(positionId)) {
    return NextResponse.json({ error: "Geçersiz pozisyon" }, { status: 400 });
  }

  // itemId varsa ek doğrulamalar
  if (itemId != null) {
    if (!DECO_PLACEABLE_IDS.has(itemId)) {
      return NextResponse.json(
        { error: "Bu ürün deco pozisyonuna yerleştirilemez" },
        { status: 400 },
      );
    }

    // Kullanıcının envanterinde bu ürün var mı?
    const { data: invRow, error: invError } = await supabase
      .from("inventory")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .maybeSingle();

    if (invError) {
      return NextResponse.json(
        { error: "Envanter kontrol edilemedi" },
        { status: 500 },
      );
    }

    if (!invRow) {
      return NextResponse.json(
        { error: "Bu ürün envanterinde yok" },
        { status: 400 },
      );
    }
  }

  // Mevcut deco_placements'ı çek
  const { data: current, error: fetchErr } = await supabase
    .from("users")
    .select("deco_placements")
    .eq("id", user.id)
    .single();

  if (fetchErr) {
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }

  // Güncel placements objesini oluştur
  const updated = { ...(current?.deco_placements ?? {}) };
  if (itemId != null) {
    updated[positionId] = itemId;
  } else {
    delete updated[positionId];
  }

  // Geri yaz
  const { error: writeErr } = await supabase
    .from("users")
    .update({ deco_placements: updated })
    .eq("id", user.id);

  if (writeErr) {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }

  return NextResponse.json({ placements: updated });
}
