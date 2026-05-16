// Fetches the previous day's logtime (in hours) for a given intra login.
// Requires FT_API_CLIENT_ID and FT_API_CLIENT_SECRET env vars.

const API_BASE_URL = "https://api.intra.42.fr";
const DEFAULT_TIME_ZONE = process.env.FT_API_TIME_ZONE || "Europe/Istanbul";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function getBearerToken() {
  const res = await fetch(`${API_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.FT_API_CLIENT_ID,
      client_secret: process.env.FT_API_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error("42 API token request failed");
  const { access_token } = await res.json();
  return access_token;
}

function formatDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function getYesterdayDateString(timeZone = DEFAULT_TIME_ZONE) {
  return formatDateInTimeZone(new Date(Date.now() - ONE_DAY_MS), timeZone);
}

export function parseLocationDurationToSeconds(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const [hours, minutes, seconds] = value.split(":");
  const parsedHours = Number.parseInt(hours, 10);
  const parsedMinutes = Number.parseInt(minutes, 10);
  const parsedSeconds = Number.parseFloat(seconds);

  if (
    Number.isNaN(parsedHours) ||
    Number.isNaN(parsedMinutes) ||
    Number.isNaN(parsedSeconds)
  ) {
    return 0;
  }

  return parsedHours * 3600 + parsedMinutes * 60 + parsedSeconds;
}

export function formatLogtimeHours(hours) {
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const totalMinutes = Math.round(safeHours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${wholeHours} saat ${minutes.toString().padStart(2, "0")} dk`;
}

export async function fetchLogtimeForDate(login, date, timeZone = DEFAULT_TIME_ZONE) {
  const token = await getBearerToken();
  const params = new URLSearchParams({
    begin_at: date,
    end_at: date,
    time_zone: timeZone,
  });

  const res = await fetch(
    `${API_BASE_URL}/v2/users/${encodeURIComponent(login)}/locations_stats?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`42 locations_stats request failed: ${res.status}`);
  }

  const data = await res.json();
  const totalSeconds = Object.values(data).reduce(
    (acc, value) => acc + parseLocationDurationToSeconds(value),
    0
  );
  const hours = totalSeconds / 3600;

  return {
    date,
    hours,
    raw: data,
    rawValue: data?.[date] ?? null,
    seconds: totalSeconds,
    timeZone,
  };
}

export async function fetchYesterdayLogtimeDetails(
  login,
  timeZone = DEFAULT_TIME_ZONE
) {
  return fetchLogtimeForDate(login, getYesterdayDateString(timeZone), timeZone);
}

export async function fetchYesterdayLogtime(login) {
  const details = await fetchYesterdayLogtimeDetails(login);

  return details.hours;
}
