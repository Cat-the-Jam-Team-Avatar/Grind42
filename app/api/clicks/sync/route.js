import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/clicks/sync
 *
 * Batch-syncs accumulated click earnings to the database.
 * Called by the client store after a debounce period (3s of inactivity),
 * on page unload, or when the click window fills up.
 *
 * Body: { coins: number, xp: number, clicks: number }
 */
export async function POST(request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { coins, xp, clicks } = body;

  if (typeof coins !== "number" || typeof clicks !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Sanitize — prevent negative values or absurd amounts
  // Round coins since DB column is integer
  const safeCoins = Math.round(Math.max(0, Math.min(coins, 50000)));
  const safeXp = Math.round(Math.max(0, Math.min(xp ?? 0, 10000)));
  const safeClicks = Math.round(Math.max(0, Math.min(clicks, 2000)));

  if (safeCoins === 0 && safeXp === 0) {
    return NextResponse.json({ ok: true, synced: 0 });
  }

  // Fetch current player data for atomic increment
  const { data: player, error: fetchError } = await supabase
    .from("users")
    .select("balance, total_coins, weekly_coins, total_clicks, xp")
    .eq("id", user.id)
    .single();

  if (fetchError || !player) {
    return NextResponse.json(
      { error: "Kullanıcı bulunamadı", details: fetchError?.message },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      balance: (player.balance ?? 0) + safeCoins,
      total_coins: (player.total_coins ?? 0) + safeCoins,
      weekly_coins: (player.weekly_coins ?? 0) + safeCoins,
      total_clicks: (player.total_clicks ?? 0) + safeClicks,
      xp: (player.xp ?? 0) + safeXp,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Sync başarısız", details: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    synced: { coins: safeCoins, xp: safeXp, clicks: safeClicks },
  });
}
