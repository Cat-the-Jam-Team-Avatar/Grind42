export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { fetchUserInventory } from "@/lib/market/inventory";
import MarketGrid from "@/components/market/MarketGrid";
import InventoryPanel from "@/components/market/InventoryPanel";
import { MARKET_CATALOG } from "@/lib/economy";

export default async function MarketPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: player }, { data: inventory }] = await Promise.all([
    supabase
      .from("users")
      .select("balance")
      .eq("id", user.id)
      .single(),
    fetchUserInventory(supabase, user.id),
  ]);

  const ownedIds = inventory?.ownedIds ?? [];
  const quantityById = inventory?.quantityById ?? {};
  const equippedById = inventory?.equippedById ?? {};
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

      <MarketGrid
        items={MARKET_CATALOG}
        balance={balance}
        equippedById={equippedById}
        ownedIds={ownedIds}
        quantityById={quantityById}
      />
      <InventoryPanel
        ownedIds={ownedIds}
        allItems={MARKET_CATALOG}
        equippedById={equippedById}
        quantityById={quantityById}
      />
    </div>
  );
}
