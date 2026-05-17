import { NextResponse } from "next/server";
import { fetchUserInventory } from "@/lib/market/inventory";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await fetchUserInventory(supabase, user.id);

  if (error) {
    return NextResponse.json(
      { details: error.message, error: "Envanter alınamadı" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
