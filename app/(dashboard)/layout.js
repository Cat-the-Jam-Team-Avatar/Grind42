export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import AppShell from "@/components/app/AppShell";

export default async function DashboardLayout({ children }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: player } = await supabase
    .from("users")
    .select("intra_login, balance, current_streak")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell user={user} player={player}>
      {children}
    </AppShell>
  );
}
