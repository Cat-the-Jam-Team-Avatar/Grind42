import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Geçerli masa ID formatı: "kolon-satır" örn. "12.5-37"
// COL_X × ROW_Y kombinasyonları
const VALID_COL_X = [6, 12.5, 19, 25.5, 38.5, 45, 51.5, 58];
const VALID_ROW_Y = [22, 37, 52, 67, 82];
const VALID_DESK_IDS = new Set(
  VALID_COL_X.flatMap((x) => VALID_ROW_Y.map((y) => `${x}-${y}`)),
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

  const { deskId, action } = body;

  // deskId geçerli mi?
  if (!deskId || !VALID_DESK_IDS.has(deskId)) {
    return NextResponse.json({ error: "Geçersiz masa ID" }, { status: 400 });
  }

  // action "buy" veya "upgrade" olmalı
  if (action !== "buy" && action !== "upgrade") {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  // Mevcut desk_states'i oku
  const { data: playerRow, error: fetchError } = await supabase
    .from("users")
    .select("desk_states")
    .eq("id", user.id)
    .single();

  if (fetchError) {
    return NextResponse.json(
      { error: "Kullanıcı verisi alınamadı" },
      { status: 500 },
    );
  }

  const currentStates = playerRow?.desk_states ?? {};
  const currentDesk = currentStates[deskId];

  let updatedDesk;

  if (action === "buy") {
    // Zaten bilgisayar varsa hata
    if (currentDesk?.hasComputer) {
      return NextResponse.json(
        { error: "Bu masada zaten bilgisayar var" },
        { status: 400 },
      );
    }
    updatedDesk = { hasComputer: true, level: 1 };
  } else {
    // upgrade: bilgisayar olmadan yükseltme yapılamaz
    if (!currentDesk?.hasComputer) {
      return NextResponse.json(
        { error: "Bu masada bilgisayar yok" },
        { status: 400 },
      );
    }
    updatedDesk = { hasComputer: true, level: (currentDesk.level ?? 1) + 1 };
  }

  const newStates = { ...currentStates, [deskId]: updatedDesk };

  const { error: updateError } = await supabase
    .from("users")
    .update({ desk_states: newStates })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Kayıt sırasında hata oluştu" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, desk: updatedDesk });
}
