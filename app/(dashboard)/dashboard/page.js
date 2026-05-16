export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import StatsPanel from "@/components/dashboard/StatsPanel";
import PixelDesk from "@/components/dashboard/PixelDesk";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import DailyClaimButton from "@/components/dashboard/DailyClaimButton";
import AuthDevPanel from "@/components/dashboard/AuthDevPanel";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";
import {
  buildFortyTwoProfilePatch,
  fetchFortyTwoPublicProfile,
  getPlayerFortyTwoTimeZone,
} from "@/lib/auth/forty-two";

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
  const { data: { user } } = await supabase.auth.getUser();

  let { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  player = await syncMissingFortyTwoProfile(supabase, player);

  let yesterdayLogtime = null;

  if (player?.intra_login) {
    try {
      yesterdayLogtime = await fetchYesterdayLogtimeDetails(
        player.intra_login,
        getPlayerFortyTwoTimeZone(player)
      );
    } catch (error) {
      yesterdayLogtime = {
        error: error instanceof Error ? error.message : "42 logtime alınamadı.",
      };
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Sol Panel */}
      <div className="flex flex-col gap-4">
        <StatsPanel player={player} yesterdayLogtime={yesterdayLogtime} />
        <StreakDisplay streak={player?.current_streak ?? 0} />
      </div>

      {/* Merkez: Pixel Masa */}
      <div className="flex flex-col items-center justify-center gap-4">
        <PixelDesk inventory={player?.inventory ?? []} />
        <DailyClaimButton claimed={player?.claimed_today ?? false} />
      </div>

      <AuthDevPanel
        user={user}
        player={player}
        yesterdayLogtime={yesterdayLogtime}
      />
    </div>
  );
}
