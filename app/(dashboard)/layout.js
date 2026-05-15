export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="nes-container p-2 flex items-center justify-between">
        <span className="nes-text is-primary text-xs">42 Tycoon</span>
        <div className="flex gap-4">
          <a href="/dashboard" className="nes-text text-xs">Ana Sayfa</a>
          <a href="/market" className="nes-text text-xs">Market</a>
          <a href="/leaderboard" className="nes-text text-xs">Liderlik</a>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
