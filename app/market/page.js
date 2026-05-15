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

  const ownedIds = (player?.inventory ?? []).map((i) => i.item_id);

  return (
    <div className="p-4 flex flex-col gap-6">
      <h2 className="nes-text is-primary text-sm">Market</h2>
      <p className="nes-text text-xs">
        Bakiye:{" "}
        <span className="is-warning">{player?.balance ?? 0} LogCoin</span>
      </p>
      <MarketGrid items={MARKET_ITEMS} balance={player?.balance ?? 0} ownedIds={ownedIds} />
      <InventoryPanel ownedIds={ownedIds} allItems={MARKET_ITEMS} />
    </div>
  );
}
