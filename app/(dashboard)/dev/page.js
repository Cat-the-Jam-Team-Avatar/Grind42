export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { fetchYesterdayLogtimeDetails } from "@/lib/42api/logtime";
import AuthDevPanel from "@/components/dashboard/AuthDevPanel";

export default async function DevPage() {
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
    <div className="flex flex-col gap-[18px]">
      <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
        <p className="title">Dev Konsolu</p>
        <div className="flex items-center justify-between gap-4 mb-[10px] [&_p]:m-0">
          <div>
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px]">42 Auth Snapshot</p>
            <p className="text-[18px] leading-snug text-g42-ink-soft">
              Giriş, provider profili ve dünkü logtime verisi burada izole edildi.
            </p>
          </div>
        </div>
      </section>

      <AuthDevPanel user={user} player={player} yesterdayLogtime={yesterdayLogtime} />
    </div>
  );
}
