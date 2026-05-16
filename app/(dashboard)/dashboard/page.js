export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import StatsPanel from "@/components/dashboard/StatsPanel";
import PixelDesk from "@/components/dashboard/PixelDesk";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import DailyClaimButton from "@/components/dashboard/DailyClaimButton";
import { getMultiplier } from "@/lib/streak";

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: player } = await supabase
    .from("users")
    .select("*, inventory(item_id)")
    .eq("id", user.id)
    .single();

  const multiplier = getMultiplier(player?.current_streak ?? 0);

  return (
    <div className="grid items-start [grid-template-columns:minmax(240px,0.72fr)_minmax(0,1.28fr)] gap-[18px] max-[920px]:[grid-template-columns:1fr]">
      <aside className="flex min-w-0 flex-col gap-[18px]">
        <StatsPanel player={player} />
        <StreakDisplay streak={player?.current_streak ?? 0} />

        <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
          <p className="title">Daily Claim</p>
          <div className="grid items-stretch grid-cols-1 gap-[14px] !p-[18px] [&_.nes-btn]:w-full [&_.nes-btn]:min-h-[58px] [&_.nes-btn]:!text-xs">
            <div>
              <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">Bugünkü çarpan</p>
              <p className="text-g42-ink font-[var(--font-silkscreen),monospace] text-[clamp(24px,4vw,36px)] leading-[1.05]">x{multiplier.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-g42-muted font-[var(--font-silkscreen),monospace] text-[11px]">Durum</p>
              <p className="text-[18px] leading-snug text-g42-ink-soft">
                {player?.claimed_today ? "Bugünün ödülü alındı." : "Dünkü logtime ödülünü topla."}
              </p>
            </div>
            <DailyClaimButton claimed={player?.claimed_today ?? false} />
          </div>
        </section>
      </aside>

      <section className="flex min-w-0 flex-col gap-[18px]">
        <div className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
          <p className="title">Sanal Cluster</p>
          <div className="flex items-center justify-between gap-4 mb-[10px] [&_p]:m-0">
            <div>
              <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px]">Masan hazır, grind başlasın.</p>
              <p className="text-[18px] leading-snug text-g42-ink-soft">
                Marketten aldığın ekipmanlar burada pixel masaya yansır.
              </p>
            </div>
            <span className="inline-flex items-center m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-2 py-[6px] text-[11px]">v0.1</span>
          </div>
          <PixelDesk inventory={player?.inventory ?? []} />
        </div>
      </section>
    </div>
  );
}
