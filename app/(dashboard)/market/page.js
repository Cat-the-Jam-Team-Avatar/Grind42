export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import MarketGrid from "@/components/market/MarketGrid";
import InventoryPanel from "@/components/market/InventoryPanel";
import { MARKET_ITEMS } from "@/lib/economy";

export default async function MarketPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: player } = await supabase
    .from("users")
    .select("balance, inventory(item_id)")
    .eq("id", user.id)
    .single();

  const ownedIds = (player?.inventory ?? []).map((item) => item.item_id);
  const balance = player?.balance ?? 0;

  return (
    <div className="flex flex-col gap-[18px]">
      <section className="nes-container min-w-0 !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] ![font-family:var(--font-pixelify),system-ui,sans-serif] with-title">
        <p className="title">Market</p>
        <div className="flex items-center justify-between gap-4 mb-[10px] [&_p]:m-0">
          <div>
            <p className="m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-accent-2 text-[18px]">Cluster Dükkanı</p>
            <p className="text-[18px] leading-snug text-g42-ink-soft">
              Kalıcı geliştirmeler, taktik eşyalar ve masanı gösteren kozmetikler.
            </p>
          </div>
          <span className="inline-flex items-center m-0 font-[var(--font-silkscreen),monospace] tracking-[0] text-g42-ink gap-[6px] border-[3px] border-g42-line bg-g42-paper-2 px-2 py-[6px] text-[11px]">{balance.toLocaleString("tr-TR")} LC</span>
        </div>
      </section>

      <MarketGrid items={MARKET_ITEMS} balance={balance} ownedIds={ownedIds} />
      <InventoryPanel ownedIds={ownedIds} allItems={MARKET_ITEMS} />
    </div>
  );
}
