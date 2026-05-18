import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLICK_WINDOW_HOURS, CLICK_WINDOW_MAX } from "@/lib/economy";

function isMissingClickWindowSchemaError(error) {
  return ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703"].includes(
    error?.code,
  );
}

function toClickWindow(data) {
  const expiresAt = data.click_window_expires_at ?? null;
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : null;
  const isLocked =
    (data.click_window_count ?? 0) >= CLICK_WINDOW_MAX &&
    Number.isFinite(expiresAtMs) &&
    expiresAtMs > Date.now();

  return {
    count: data.click_window_count ?? 0,
    expiresAt,
    lockedUntil: isLocked ? expiresAtMs : null,
    max: CLICK_WINDOW_MAX,
    startedAt: data.click_window_started_at ?? null,
  };
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const safeClicks = Math.round(
    Math.max(0, Math.min(clicks, CLICK_WINDOW_MAX)),
  );

  let admin;

  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : undefined,
        error: "Click sync servisi yapılandırılmamış",
      },
      { status: 500 },
    );
  }

  // Click Frenzy aktifse click window limitini bypass et
  const { data: frenzyData } = await admin
    .from("users")
    .select("click_frenzy_until")
    .eq("id", user.id)
    .maybeSingle();
  const frenzyActive =
    frenzyData?.click_frenzy_until &&
    new Date(frenzyData.click_frenzy_until) > new Date();
  const effectiveWindowMax = frenzyActive ? 999999 : CLICK_WINDOW_MAX;

  const { data, error } = await admin
    .rpc("sync_click_window", {
      p_clicks: safeClicks,
      p_coins: safeCoins,
      p_user_id: user.id,
      p_window_hours: CLICK_WINDOW_HOURS,
      p_window_max: effectiveWindowMax,
      p_xp: safeXp,
    })
    .single();

  if (error) {
    if (isMissingClickWindowSchemaError(error)) {
      return NextResponse.json(
        {
          details: error.message,
          error: "Click window migration uygulanmamış",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Sync başarısız", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    clickWindow: toClickWindow(data),
    ok: true,
    player: {
      balance: data.balance,
      total_coins: data.total_coins,
      total_clicks: data.total_clicks,
      weekly_coins: data.weekly_coins,
      xp: data.xp,
    },
    rejectedClicks: data.rejected_clicks ?? 0,
    synced: {
      clicks: data.accepted_clicks ?? 0,
      coins: data.synced_coins ?? 0,
      xp: data.synced_xp ?? 0,
    },
  });
}
