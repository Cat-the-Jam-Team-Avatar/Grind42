export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";

export default async function LeaderboardPage() {
  const supabase = await createServerClient();

  const { data: weekly } = await supabase
    .from("users")
    .select("intra_login, weekly_coins, current_streak")
    .order("weekly_coins", { ascending: false })
    .limit(20);

  const { data: allTime } = await supabase
    .from("users")
    .select("intra_login, total_coins, current_streak")
    .order("total_coins", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
        <p className="title">High Scores</p>
        <div className="flex items-center justify-between gap-4 mb-[10px] [&_p]:m-0">
          <div>
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px]">Kampüs Sıralaması</p>
            <p className="text-[18px] leading-snug text-g42-ink-soft">
              Haftanın grind listesi ve tüm zamanların LogCoin tablosu.
            </p>
          </div>
        </div>
      </section>

      <LeaderboardTable weekly={weekly ?? []} allTime={allTime ?? []} />
    </div>
  );
}
