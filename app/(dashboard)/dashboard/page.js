export const dynamic = "force-dynamic";

import { createServerClient } from "@/lib/supabase/server";
import { fetchUserInventory } from "@/lib/market/inventory";
import StatsPanel from "@/components/dashboard/StatsPanel";
import ClusterMap from "@/components/dashboard/ClusterMap";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import DailyClaimButton from "@/components/dashboard/DailyClaimButton";
import CampusClicker from "@/components/dashboard/CampusClicker";
import PlayerStoreHydrator from "@/components/app/PlayerStoreHydrator";
import OfficeAmbience from "@/components/app/OfficeAmbience";
import {
  fetchYesterdayLogtimeDetails,
  fetchLogtimeForDate,
  getTodayDateString,
} from "@/lib/42api/logtime";
import {
  buildFortyTwoCoalitionPatch,
  buildFortyTwoProfilePatch,
  fetchFortyTwoPrimaryCoalition,
  fetchFortyTwoPublicProfile,
  getPlayerFortyTwoTimeZone,
} from "@/lib/auth/forty-two";
import { getMultiplier } from "@/lib/streak";

/* ── Server helpers ──────────────────────────────────────────────────────── */

async function syncMissingFortyTwoProfile(supabase, player) {
  if (!player?.intra_login) return player;

  const needsProfile = !player.profile_image_url;
  const needsCoalition = !player.coalition_slug;

  if (!needsProfile && !needsCoalition) return player;

  try {
    const profile = needsProfile
      ? await fetchFortyTwoPublicProfile(player.intra_login)
      : player.forty_two_profile;
    const coalition = needsCoalition
      ? await fetchFortyTwoPrimaryCoalition(player.intra_login, profile)
      : undefined;
    const patch = {
      ...(needsProfile ? buildFortyTwoProfilePatch(profile) : {}),
      ...(needsCoalition ? buildFortyTwoCoalitionPatch(coalition) : {}),
    };

    if (Object.keys(patch).length === 0) return player;

    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", player.id)
      .select("*")
      .single();

    if (error) {
      console.warn("42 profile backfill failed", error);
      return player;
    }

    return data ?? { ...player, ...patch };
  } catch (error) {
    console.warn("42 profile backfill skipped", error);
    return player;
  }
}

async function fetchPlayerLogtime(player) {
  if (!player?.intra_login) return null;

  try {
    return await fetchYesterdayLogtimeDetails(
      player.intra_login,
      getPlayerFortyTwoTimeZone(player),
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "42 logtime alınamadı.",
    };
  }
}

async function fetchTodayLogtime(player) {
  if (!player?.intra_login) return null;

  try {
    const timeZone = getPlayerFortyTwoTimeZone(player);
    return await fetchLogtimeForDate(player.intra_login, getTodayDateString(timeZone), timeZone);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "42 logtime alınamadı.",
    };
  }
}

async function fetchLiveLocation(player) {
  if (!player?.intra_login) return undefined;
  try {
    const profile = await fetchFortyTwoPublicProfile(player.intra_login);
    const loc = profile?.location;
    return typeof loc === "string" && loc.trim() ? loc.trim() : null;
  } catch {
    return undefined;
  }
}

/* ── Page Component ──────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: player } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  player = await syncMissingFortyTwoProfile(supabase, player);

  const { data: inventory } = await fetchUserInventory(supabase, user.id, {
    includePurchases: false,
  });
  player = {
    ...player,
    inventory: inventory?.items ?? [],
  };

  const multiplier = getMultiplier(player?.current_streak ?? 0);
  const [yesterdayLogtime, todayLogtime, liveLocation] = await Promise.all([
    fetchPlayerLogtime(player),
    fetchTodayLogtime(player),
    fetchLiveLocation(player),
  ]);
  if (liveLocation !== undefined) {
    player = { ...player, intra_location: liveLocation };
  }

  return (
    <div className="flex flex-col gap-5">
      <OfficeAmbience />
      {/* Hydrate Zustand store with server-fetched player data */}
      <PlayerStoreHydrator player={player} />

      {/* ── Row 1: Profile + Daily Claim side by side ── */}
      <div className="grid grid-cols-1 min-[860px]:grid-cols-[1fr_320px] gap-5 items-stretch">
        <StatsPanel player={player} yesterdayLogtime={yesterdayLogtime} todayLogtime={todayLogtime} />

        <section className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] flex flex-col">
          <p className="title">Daily Claim</p>
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <div className="text-center">
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-[10px] text-g42-muted uppercase tracking-wider">
                Bugünkü çarpan
              </p>
              <p className="m-0 font-[var(--font-silkscreen),monospace] text-g42-coin-d text-[52px] leading-none tracking-tight mt-1">
                x{multiplier.toFixed(1)}
              </p>
              <p className="m-0 font-[var(--font-pixelify),system-ui,sans-serif] text-[14px] text-g42-ink-soft leading-snug mt-2">
                {player?.claimed_today
                  ? "Bugünün ödülü alındı ✓"
                  : "Dünkü logtime ödülünü topla"}
              </p>
            </div>
            <DailyClaimButton claimed={player?.claimed_today ?? false} />
          </div>
        </section>
      </div>

      {/* ── Row 2: Streak (full width) ── */}
      <StreakDisplay streak={player?.current_streak ?? 0} />

      {/* ── Row 3: Sanal Cluster — Clicker + Pixel Desk ── */}
      <section className="nes-container with-title !bg-g42-paper shadow-[0_5px_0_var(--g42-line)] min-w-0">
        <p className="title">Sanal Cluster</p>
        <CampusClicker />
        <ClusterMap inventory={player?.inventory ?? []} />
      </section>
    </div>
  );
}

