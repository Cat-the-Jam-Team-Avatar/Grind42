import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";
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

  if (player.claimed_today) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
  }

  let logtimeDetails;

  try {
    logtimeDetails = await fetchYesterdayLogtimeDetails(player.intra_login);
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

  await supabase
    .from("users")
    .update({
      balance: player.balance + coinsEarned,
      weekly_coins: player.weekly_coins + coinsEarned,
      total_coins: player.total_coins + coinsEarned,
      current_streak: nextStreak,
      claimed_today: true,
    })
    .eq("id", user.id);

  return NextResponse.json({
    coinsEarned,
    logtimeDate: logtimeDetails.date,
    logtimeHours,
    logtimeRaw: logtimeDetails.rawValue,
    multiplier,
    newStreak: nextStreak,
  });
}
