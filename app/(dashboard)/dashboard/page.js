export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import StatsPanel from "@/components/dashboard/StatsPanel";
import PixelDesk from "@/components/dashboard/PixelDesk";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import DailyClaimButton from "@/components/dashboard/DailyClaimButton";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";
import {
  buildFortyTwoProfilePatch,
  fetchFortyTwoPublicProfile,
  getPlayerFortyTwoTimeZone,
} from "@/lib/auth/forty-two";
import { getMultiplier } from "@/lib/streak";

async function syncMissingFortyTwoProfile(supabase, player) {
  if (!player?.intra_login || player.profile_image_url) return player;

  try {
    const profile = await fetchFortyTwoPublicProfile(player.intra_login);
    const patch = buildFortyTwoProfilePatch(profile);

    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", player.id)
      .select("*")
      .single();

    if (error) {
      console.warn("42 profile backfill failed", error);
      return player;
    }

    return data ?? { ...player, ...patch };
  } catch (error) {
    console.warn("42 profile backfill skipped", error);
    return player;
  }
}

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: player } = await supabase
    .from("users")
    .select("*, inventory(item_id)")
    .eq("id", user.id)
    .single();

  player = await syncMissingFortyTwoProfile(supabase, player);

  const multiplier = getMultiplier(player?.current_streak ?? 0);

  let yesterdayLogtime = null;

  if (player?.intra_login) {
    try {
      yesterdayLogtime = await fetchYesterdayLogtimeDetails(
        player.intra_login,
        getPlayerFortyTwoTimeZone(player),
      );
    } catch (error) {
      yesterdayLogtime = {
        error: error instanceof Error ? error.message : "42 logtime alınamadı.",
      };
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Profile strip — full width */}
      <StatsPanel player={player} yesterdayLogtime={yesterdayLogtime} />

      {/* Main grid: left sidebar + right desk */}
      <div className="grid grid-cols-1 min-[800px]:grid-cols-[320px_1fr] gap-4 items-start">
        {/* ── Left column: Daily Claim → Streak ── */}
        <aside className="flex flex-col gap-4 min-w-0">
          {/* Daily Claim */}
          <section className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)]">
            <p className="title">Daily Claim</p>
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="m-0 font-[var(--font-silkscreen),monospace] text-[10px] text-g42-muted">
                    Bugünkü çarpan
                  </p>
                  <p className="m-0 font-[var(--font-silkscreen),monospace] text-g42-coin-d text-[44px] leading-none tracking-tight">
                    x{multiplier.toFixed(1)}
                  </p>
                </div>
                <p className="m-0 font-[var(--font-pixelify),system-ui,sans-serif] text-[16px] text-g42-ink-soft leading-snug text-right pb-1 max-w-[150px]">
                  {player?.claimed_today
                    ? "Bugünün ödülü alındı ✓"
                    : "Dünkü logtime ödülünü topla"}
                </p>
              </div>
              <DailyClaimButton claimed={player?.claimed_today ?? false} />
            </div>
          </section>

          {/* Streak */}
          <StreakDisplay streak={player?.current_streak ?? 0} />
        </aside>

        {/* ── Right: Pixel Desk ── */}
        <section className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] min-w-0">
          <p className="title">Sanal Cluster</p>
          <PixelDesk inventory={player?.inventory ?? []} />
        </section>
      </div>
    </div>
  );
}
