import { createAdminClient } from "@/lib/supabase/admin";

const LEADERBOARD_LIMIT = 20;
const LEADERBOARD_PAGE_SIZE = 1000;
const BASE_SELECT_COLUMNS = [
  "id",
  "intra_login",
  "display_name",
  "profile_image_url",
  "weekly_coins",
  "total_coins",
  "current_streak",
];
const COALITION_SELECT_COLUMNS = [
  "coalition_name",
  "coalition_slug",
  "coalition_color",
  "coalition_image_url",
];
const SELECT_COLUMNS = [
  ...BASE_SELECT_COLUMNS,
  ...COALITION_SELECT_COLUMNS,
].join(",");
const FALLBACK_SELECT_COLUMNS = BASE_SELECT_COLUMNS.join(",");

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

function readColor(value) {
  const color = readText(value);

  if (!color || !/^#[0-9a-f]{3,8}$/i.test(color)) return null;

  return color;
}

function isMissingCoalitionColumnError(error) {
  return (
    error?.code === "PGRST204" ||
    COALITION_SELECT_COLUMNS.some((column) =>
      error?.message?.includes(column)
    )
  );
}

function toPublicCoalition(row) {
  const slug = readText(row.coalition_slug);
  const name = readText(row.coalition_name);

  if (!slug && !name) return null;

  return {
    color: readColor(row.coalition_color),
    image_url: readText(row.coalition_image_url),
    name: name ?? slug,
    slug: slug ?? name,
  };
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
    coalition: toPublicCoalition(row),
    current_streak: toSafeInteger(row.current_streak),
    display_name: displayName,
    intra_login: login,
    isCurrentUser: Boolean(currentUserId && row.id === currentUserId),
    profile_image_url: readText(row.profile_image_url),
    rank,
    score: toSafeInteger(row[metric.column]),
  };
}

function buildMetricPayload(rows, metric, currentUserId, label = metric.label) {
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
    label,
    rows: rankedRows.slice(0, LEADERBOARD_LIMIT),
    scoreLabel: metric.scoreLabel,
    topScore: rankedRows[0]?.score ?? 0,
    totalPlayers: rankedRows.length,
    totalScore,
  };
}

function buildCoalitionOptions(rows) {
  const optionsBySlug = new Map();

  for (const row of rows) {
    const coalition = toPublicCoalition(row);

    if (!coalition?.slug) continue;

    const existing = optionsBySlug.get(coalition.slug);

    if (existing) {
      existing.totalPlayers += 1;
      continue;
    }

    optionsBySlug.set(coalition.slug, {
      ...coalition,
      totalPlayers: 1,
    });
  }

  return [...optionsBySlug.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "tr")
  );
}

function buildCoalitionWeeklyStandings(rows, currentUserId) {
  const standingsBySlug = new Map();

  for (const row of rows) {
    const coalition = toPublicCoalition(row);

    if (!coalition?.slug) continue;

    const existing =
      standingsBySlug.get(coalition.slug) ??
      {
        activePlayers: 0,
        allTimeScore: 0,
        coalition,
        isCurrentUserCoalition: false,
        totalPlayers: 0,
        weeklyScore: 0,
      };
    const weeklyScore = toSafeInteger(row.weekly_coins);

    existing.activePlayers += weeklyScore > 0 ? 1 : 0;
    existing.allTimeScore += toSafeInteger(row.total_coins);
    existing.isCurrentUserCoalition =
      existing.isCurrentUserCoalition ||
      Boolean(currentUserId && row.id === currentUserId);
    existing.totalPlayers += 1;
    existing.weeklyScore += weeklyScore;

    standingsBySlug.set(coalition.slug, existing);
  }

  return [...standingsBySlug.values()]
    .sort((a, b) => {
      const scoreDelta = b.weeklyScore - a.weeklyScore;

      if (scoreDelta !== 0) return scoreDelta;

      const activeDelta = b.activePlayers - a.activePlayers;

      if (activeDelta !== 0) return activeDelta;

      const playerDelta = b.totalPlayers - a.totalPlayers;

      if (playerDelta !== 0) return playerDelta;

      return String(a.coalition.name).localeCompare(
        String(b.coalition.name),
        "tr"
      );
    })
    .map((standing, index) => ({
      ...standing,
      rank: index + 1,
    }));
}

function buildCoalitionPayload(rows, currentUserId) {
  const options = buildCoalitionOptions(rows);
  const currentUserRow = rows.find((row) => currentUserId && row.id === currentUserId);
  const currentUserCoalitionSlug = readText(currentUserRow?.coalition_slug);
  const metricsBySlug = {};

  for (const option of options) {
    const coalitionRows = rows.filter(
      (row) => readText(row.coalition_slug) === option.slug
    );

    metricsBySlug[option.slug] = {
      allTime: buildMetricPayload(
        coalitionRows,
        METRICS.allTime,
        currentUserId,
        `${option.name} / Tüm Zamanlar`
      ),
      weekly: buildMetricPayload(
        coalitionRows,
        METRICS.weekly,
        currentUserId,
        `${option.name} / Bu Hafta`
      ),
    };
  }

  return {
    currentUserCoalitionSlug,
    metricsBySlug,
    options,
    weeklyStandings: buildCoalitionWeeklyStandings(rows, currentUserId),
  };
}

async function fetchAllLeaderboardRows(admin) {
  const rows = [];
  let expectedCount = null;
  let from = 0;
  let selectColumns = SELECT_COLUMNS;

  while (true) {
    const to = from + LEADERBOARD_PAGE_SIZE - 1;
    const { count, data, error } = await admin
      .from("users")
      .select(selectColumns, { count: "exact" })
      .order("intra_login", { ascending: true })
      .range(from, to);

    if (error) {
      if (
        selectColumns === SELECT_COLUMNS &&
        isMissingCoalitionColumnError(error)
      ) {
        rows.length = 0;
        expectedCount = null;
        from = 0;
        selectColumns = FALLBACK_SELECT_COLUMNS;
        continue;
      }

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
    coalitions: buildCoalitionPayload(rows, currentUserId),
    generatedAt: generatedAt.toISOString(),
    generatedAtLabel: formatGeneratedAt(generatedAt),
    limit: LEADERBOARD_LIMIT,
    weekly: buildMetricPayload(rows, METRICS.weekly, currentUserId),
  };
}
