// Fetches the previous day's logtime (in hours) for a given intra login.
// Requires FT_API_CLIENT_ID and FT_API_CLIENT_SECRET env vars.

import { FORTY_TWO_API_BASE_URL, getFortyTwoAppToken } from "@/lib/42api/client";

const DEFAULT_TIME_ZONE = process.env.FT_API_TIME_ZONE || "Europe/Istanbul";

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

export function getTodayDateString(
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date()
) {
  return formatDateInTimeZone(now, timeZone);
}

export function addDaysToDateString(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));

  return nextDate.toISOString().slice(0, 10);
}

export function getYesterdayDateString(
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date()
) {
  return addDaysToDateString(formatDateInTimeZone(now, timeZone), -1);
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
  const token = await getFortyTwoAppToken();
  const endDate = addDaysToDateString(date, 1);
  const params = new URLSearchParams({
    begin_at: date,
    end_at: endDate,
    time_zone: timeZone,
  });

  const res = await fetch(
    `${FORTY_TWO_API_BASE_URL}/v2/users/${encodeURIComponent(login)}/locations_stats?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`42 locations_stats request failed: ${res.status}`);
  }

  const data = await res.json();
  const rawValue = data?.[date] ?? null;
  const totalSeconds = parseLocationDurationToSeconds(rawValue);
  const hours = totalSeconds / 3600;

  return {
    beginAt: date,
    date,
    endAt: endDate,
    hours,
    raw: data,
    rawValue,
    returnedDates: Object.keys(data ?? {}),
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

// Kullanıcının şu an cluster'da online olup olmadığını kontrol eder.
// 42 API'den canlı veri çeker — null dönerse offline demektir.
export async function fetchCurrentLocation(login) {
  const token = await getFortyTwoAppToken();
  const res = await fetch(
    `${FORTY_TWO_API_BASE_URL}/v2/users/${encodeURIComponent(login)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`42 user location fetch failed: ${res.status}`);
  }

  const data = await res.json();
  const location = data?.location;
  // location bir string ise (örn. "e1r1p1") online, null ise offline
  return typeof location === "string" && location.length > 0 ? location : null;
}
