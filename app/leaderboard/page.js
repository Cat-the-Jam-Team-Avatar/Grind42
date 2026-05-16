export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default async function LeaderboardPage() {
  const supabase = await createServerClient();

  const { data: weekly } = await supabase
    .from("users")
    .select("intra_login, display_name, profile_image_url, weekly_coins, current_streak")
    .order("weekly_coins", { ascending: false })
    .limit(20);

  const { data: allTime } = await supabase
    .from("users")
    .select("intra_login, display_name, profile_image_url, total_coins, current_streak")
    .order("total_coins", { ascending: false })
    .limit(20);

  return (
    <div className="p-4 flex flex-col gap-6">
      <h2 className="nes-text is-primary text-sm">High Scores</h2>
      <LeaderboardTable weekly={weekly ?? []} allTime={allTime ?? []} />
    </div>
  );
}
