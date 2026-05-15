export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import StatsPanel from "@/components/dashboard/StatsPanel";
import PixelDesk from "@/components/dashboard/PixelDesk";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import DailyClaimButton from "@/components/dashboard/DailyClaimButton";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

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

      {/* Sağ Panel (placeholder) */}
      <div className="nes-container is-dark">
        <p className="nes-text text-xs opacity-50">Yakında: Mini istatistikler</p>
      </div>
    </div>
  );
}
