import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";
import { getPlayerFortyTwoTimeZone } from "@/lib/auth/forty-two";
import { calcEarnings, getMultiplier } from "@/lib/economy";
import { getNextStreak, isStreakFrozen } from "@/lib/streak";

export async function POST() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!player?.intra_login) {
    return NextResponse.json({ error: "42 login bulunamadı" }, { status: 400 });
  }

  if (player.claimed_today) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
  }

  // Check if streak is frozen (Bocal İzni) — system is disabled for the user
  const today = new Date().toISOString().slice(0, 10);
  if (isStreakFrozen(player.streak_frozen_until, today)) {
    return NextResponse.json(
      { error: "Streak dondurulmuş — bugün claim yapılamaz" },
      { status: 400 }
    );
  }

  let logtimeDetails;

  try {
    logtimeDetails = await fetchYesterdayLogtimeDetails(
      player.intra_login,
      getPlayerFortyTwoTimeZone(player)
    );
  } catch (error) {
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : undefined,
        error: "42 logtime alınamadı",
      },
      { status: 502 }
    );
  }

  const logMinutes = logtimeDetails.seconds / 60;
  const nextStreak = getNextStreak(
    player.current_streak,
    logtimeDetails.hours,
    player.last_claim_date,
    today
  );
  const multiplier = getMultiplier(nextStreak);
  const coinsEarned = calcEarnings(logMinutes, multiplier, player.pc_level ?? 0);

  // Determine streak_started_at:
  // - If streak resets to 1 (new streak), set to today
  // - If streak continues (>1), keep existing value
  // - If streak is 0 (no logtime), clear it
  let streakStartedAt = player.streak_started_at;
  if (nextStreak === 0) {
    streakStartedAt = null;
  } else if (nextStreak === 1) {
    streakStartedAt = today;
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      balance: (player.balance ?? 0) + coinsEarned,
      weekly_coins: (player.weekly_coins ?? 0) + coinsEarned,
      total_coins: (player.total_coins ?? 0) + coinsEarned,
      current_streak: nextStreak,
      claimed_today: true,
      last_claim_date: today,
      streak_started_at: streakStartedAt,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      {
        details: updateError.message,
        error: "Claim kaydedilemedi",
      },
      { status: 500 }
    );
  }

  const { error: logtimeSyncError } = await supabase
    .from("users")
    .update({
      last_logtime_date: logtimeDetails.date,
      last_logtime_hours: logtimeDetails.hours,
      last_logtime_seconds: Math.round(logtimeDetails.seconds),
      last_logtime_synced_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (logtimeSyncError) {
    console.warn("42 logtime metadata sync failed", logtimeSyncError);
  }

  return NextResponse.json({
    coinsEarned,
    logtimeDate: logtimeDetails.date,
    logtimeHours: logtimeDetails.hours,
    logtimeRaw: logtimeDetails.rawValue,
    logtimeSeconds: logtimeDetails.seconds,
    multiplier,
    newStreak: nextStreak,
  });
}
