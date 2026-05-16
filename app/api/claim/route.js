import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";
import { getPlayerFortyTwoTimeZone } from "@/lib/auth/forty-two";
import { calculateCoins, getMultiplier } from "@/lib/economy";
import { getNextStreak } from "@/lib/streak";

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

  const logtimeHours = logtimeDetails.hours;
  const nextStreak = getNextStreak(player.current_streak, logtimeHours);
  const multiplier = getMultiplier(nextStreak);
  const coinsEarned = calculateCoins(logtimeHours, multiplier);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      balance: (player.balance ?? 0) + coinsEarned,
      weekly_coins: (player.weekly_coins ?? 0) + coinsEarned,
      total_coins: (player.total_coins ?? 0) + coinsEarned,
      current_streak: nextStreak,
      claimed_today: true,
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
      last_logtime_seconds: logtimeDetails.seconds,
      last_logtime_synced_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (logtimeSyncError) {
    console.warn("42 logtime metadata sync failed", logtimeSyncError);
  }

  return NextResponse.json({
    coinsEarned,
    logtimeDate: logtimeDetails.date,
    logtimeHours,
    logtimeRaw: logtimeDetails.rawValue,
    logtimeSeconds: logtimeDetails.seconds,
    multiplier,
    newStreak: nextStreak,
  });
}
