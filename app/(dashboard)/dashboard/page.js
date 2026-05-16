export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import StatsPanel from "@/components/dashboard/StatsPanel";
import PixelDesk from "@/components/dashboard/PixelDesk";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import DailyClaimButton from "@/components/dashboard/DailyClaimButton";
import AuthDevPanel from "@/components/dashboard/AuthDevPanel";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  let yesterdayLogtime = null;

  if (player?.intra_login) {
    try {
      yesterdayLogtime = await fetchYesterdayLogtimeDetails(player.intra_login);
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
        <StatsPanel player={player} />
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
