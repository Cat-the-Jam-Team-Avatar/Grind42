export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { getLeaderboardData } from "@/lib/leaderboard";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default async function LeaderboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let leaderboard = null;
  let errorMessage = null;

  try {
    leaderboard = await getLeaderboardData(user?.id);
  } catch (error) {
    console.error("Leaderboard fetch failed", error);
    errorMessage = "Liderlik verisi şu an alınamadı.";
  }

  return <LeaderboardTable errorMessage={errorMessage} leaderboard={leaderboard} />;
}
