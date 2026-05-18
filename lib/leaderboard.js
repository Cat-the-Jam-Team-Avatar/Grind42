import { createAdminClient } from "@/lib/supabase/admin";

const LEADERBOARD_LIMIT = 20;
const LEADERBOARD_PAGE_SIZE = 1000;
const SELECT_COLUMNS = [
  "id",
  "intra_login",
  "display_name",
  "profile_image_url",
  "weekly_coins",
  "total_coins",
  "current_streak",
].join(",");

const METRICS = {
  weekly: {
    column: "weekly_coins",
    label: "Bu Hafta",
    scoreLabel: "Haftalık LC",
  },
  allTime: {
    column: "total_coins",
    label: "Tüm Zamanlar",
    scoreLabel: "Toplam LC",
  },
};

function toSafeInteger(value) {
  const number = Number(value ?? 0);

  if (!Number.isFinite(number)) return 0;

  return Math.max(0, Math.round(number));
}

function readText(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function compareRows(metric) {
  return (a, b) => {
    const scoreDelta =
      toSafeInteger(b[metric.column]) - toSafeInteger(a[metric.column]);

    if (scoreDelta !== 0) return scoreDelta;

    const streakDelta =
      toSafeInteger(b.current_streak) - toSafeInteger(a.current_streak);

    if (streakDelta !== 0) return streakDelta;

    return String(readText(a.intra_login) ?? "").localeCompare(
      String(readText(b.intra_login) ?? ""),
      "tr",
    );
  };
}

function toPublicRow(row, metric, rank, currentUserId) {
  const login = readText(row.intra_login) ?? "cadet";
  const displayName = readText(row.display_name) ?? login;

  return {
    current_streak: toSafeInteger(row.current_streak),
    display_name: displayName,
    intra_login: login,
    isCurrentUser: Boolean(currentUserId && row.id === currentUserId),
    profile_image_url: readText(row.profile_image_url),
    rank,
    score: toSafeInteger(row[metric.column]),
  };
}

function buildMetricPayload(rows, metric, currentUserId) {
  const sortedRows = [...rows].sort(compareRows(metric));
  const rankedRows = sortedRows.map((row, index) =>
    toPublicRow(row, metric, index + 1, currentUserId),
  );
  const activePlayers = rankedRows.filter((row) => row.score > 0).length;
  const totalScore = rankedRows.reduce((sum, row) => sum + row.score, 0);

  return {
    activePlayers,
    currentUser:
      rankedRows.find((row) => row.isCurrentUser) ??
      null,
    label: metric.label,
    rows: rankedRows.slice(0, LEADERBOARD_LIMIT),
    scoreLabel: metric.scoreLabel,
    topScore: rankedRows[0]?.score ?? 0,
    totalPlayers: rankedRows.length,
    totalScore,
  };
}

async function fetchAllLeaderboardRows(admin) {
  const rows = [];
  let expectedCount = null;
  let from = 0;

  while (true) {
    const to = from + LEADERBOARD_PAGE_SIZE - 1;
    const { count, data, error } = await admin
      .from("users")
      .select(SELECT_COLUMNS, { count: "exact" })
      .order("intra_login", { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Leaderboard rows could not be loaded: ${error.message}`);
    }

    if (typeof count === "number") {
      expectedCount = count;
    }

    if (!data || data.length === 0) break;

    rows.push(...data);

    if (
      data.length < LEADERBOARD_PAGE_SIZE ||
      (expectedCount !== null && rows.length >= expectedCount)
    ) {
      break;
    }

    from += LEADERBOARD_PAGE_SIZE;
  }

  return rows;
}

function formatGeneratedAt(date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export async function getLeaderboardData(currentUserId) {
  const admin = createAdminClient();
  const rows = await fetchAllLeaderboardRows(admin);
  const generatedAt = new Date();

  return {
    allTime: buildMetricPayload(rows, METRICS.allTime, currentUserId),
    generatedAt: generatedAt.toISOString(),
    generatedAtLabel: formatGeneratedAt(generatedAt),
    limit: LEADERBOARD_LIMIT,
    weekly: buildMetricPayload(rows, METRICS.weekly, currentUserId),
  };
}
