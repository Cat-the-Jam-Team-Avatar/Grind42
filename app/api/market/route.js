import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { MARKET_ITEMS } from "@/lib/market-items";

export async function POST(request) {
  const { itemId } = await request.json();
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = MARKET_ITEMS.find((i) => i.id === itemId);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const { data: player } = await supabase
    .from("users")
    .select("balance")
    .eq("id", user.id)
    .single();

  if (player.balance < item.price) {
    return NextResponse.json({ error: "Yetersiz LogCoin" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("inventory")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing && !item.consumable) {
    return NextResponse.json({ error: "Zaten sahipsin" }, { status: 400 });
  }

  await supabase.from("inventory").insert({ user_id: user.id, item_id: itemId });
  await supabase
    .from("users")
    .update({ balance: player.balance - item.price })
    .eq("id", user.id);

  return NextResponse.json({ success: true, newBalance: player.balance - item.price });
}
