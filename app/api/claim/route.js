import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  fetchYesterdayLogtimeDetails,
  fetchCurrentLocation,
} from "@/lib/42api/logtime";
import { getPlayerFortyTwoTimeZone } from "@/lib/auth/forty-two";
import { calcEarnings, calcRemoteClaimMultiplier } from "@/lib/economy";
import {
  getNextStreak,
  getMultiplier,
  isStreakFrozen,
  STREAK_CYCLE_LENGTH,
} from "@/lib/streak";

export async function POST() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!player?.intra_login) {
    return NextResponse.json({ error: "42 login bulunamadı" }, { status: 400 });
  }

  if (player.claimed_today) {
    return NextResponse.json(
      { error: "Already claimed today" },
      { status: 400 },
    );
  }

  // Check if streak is frozen (Bocal İzni) — system is disabled for the user
  const today = new Date().toISOString().slice(0, 10);
  if (isStreakFrozen(player.streak_frozen_until, today)) {
    return NextResponse.json(
      { error: "Streak dondurulmuş — bugün claim yapılamaz" },
      { status: 400 },
    );
  }

  let logtimeDetails;

  try {
    logtimeDetails = await fetchYesterdayLogtimeDetails(
      player.intra_login,
      getPlayerFortyTwoTimeZone(player),
    );
  } catch (error) {
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : undefined,
        error: "42 logtime alınamadı",
      },
      { status: 502 },
    );
  }

  const logMinutes = logtimeDetails.seconds / 60;

  // Espresso aktifse logtime 2x say
  const effectiveLogMinutes = player.espresso_active
    ? logMinutes * 2
    : logMinutes;

  const nextStreak = getNextStreak(
    player.current_streak,
    logtimeDetails.hours,
    player.last_claim_date,
    today,
  );
  const multiplier = getMultiplier(nextStreak);

  // Kullanıcının şu an cluster'da online olup olmadığını kontrol et
  let isOnlineInCluster = false;
  try {
    const currentLocation = await fetchCurrentLocation(player.intra_login);
    isOnlineInCluster = currentLocation !== null;
  } catch {
    // 42 API'ye ulaşılamazsa güvenli taraf: offline say
    isOnlineInCluster = false;
  }

  // Online değilse: 0.3x çarpan ve streak sıfırla
  let finalStreak = isOnlineInCluster ? nextStreak : 0;
  let finalMultiplier = isOnlineInCluster
    ? multiplier
    : calcRemoteClaimMultiplier(player.pc_level ?? 0);

  let coinsEarned = calcEarnings(
    effectiveLogMinutes,
    finalMultiplier,
    player.pc_level ?? 0,
  );

  // Freeze aktifse: streak kırılmaz ama coin = 0
  if (player.freeze_active) {
    const frozenStreak =
      (player.current_streak ?? 0) >= STREAK_CYCLE_LENGTH
        ? 1
        : (player.current_streak ?? 0) + 1;
    if (finalStreak === 0) finalStreak = frozenStreak;
    coinsEarned = 0;
  }

  // streak_started_at belirleme:
  // - finalStreak sıfırlanmışsa (0) → null
  // - finalStreak 1'e yeniden başladıysa → bugün
  // - devam ediyorsa → mevcut değeri koru
  let streakStartedAt = player.streak_started_at;
  if (finalStreak === 0) {
    streakStartedAt = null;
  } else if (finalStreak === 1) {
    streakStartedAt = today;
  }

  // Streak kırıldıysa mevcut değeri sakla (streak_restore için)
  const previousStreakUpdate =
    finalStreak === 0 && (player.current_streak ?? 0) > 0
      ? { previous_streak: player.current_streak }
      : {};

  const { error: updateError } = await supabase
    .from("users")
    .update({
      balance: (player.balance ?? 0) + coinsEarned,
      weekly_coins: (player.weekly_coins ?? 0) + coinsEarned,
      total_coins: (player.total_coins ?? 0) + coinsEarned,
      current_streak: finalStreak,
      claimed_today: true,
      last_claim_date: today,
      streak_started_at: streakStartedAt,
      // Kullanılan efekt bayraklarını temizle
      espresso_active: false,
      freeze_active: false,
      ...previousStreakUpdate,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      {
        details: updateError.message,
        error: "Claim kaydedilemedi",
      },
      { status: 500 },
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
    isOnlineInCluster,
    logtimeDate: logtimeDetails.date,
    logtimeHours: logtimeDetails.hours,
    logtimeRaw: logtimeDetails.rawValue,
    logtimeSeconds: logtimeDetails.seconds,
    multiplier: finalMultiplier,
    newStreak: finalStreak,
  });
}
