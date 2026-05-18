import {
  FORTY_TWO_API_BASE_URL,
  getFortyTwoAppToken,
} from "@/lib/42api/client";

export const FORTY_TWO_PROVIDER = "custom:42-school";
export const FORTY_TWO_SCOPES = "public";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const FORTY_TWO_ME_URL = "https://api.intra.42.fr/v2/me";

const FORTY_TWO_CURSUS_COALITION_PREFIX = "42cursus-";

const LOGIN_KEYS = [
  "login",
  "user_name",
  "preferred_username",
  "nickname",
  "username",
];

function readString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function readFirst(source, paths) {
  for (const path of paths) {
    const value = readPath(source, path);

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function normalizeLogin(value) {
  const login = value.trim();

  if (login.includes("@")) {
    return login.split("@")[0];
  }

  return login;
}

function slugifyText(value) {
  const text = readString(value);

  if (!text) return null;

  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readCoalitionSlug(coalition) {
  return readString(coalition?.slug)?.toLowerCase() ?? null;
}

function isFortyTwoCursusCoalition(coalition) {
  return readCoalitionSlug(coalition)?.startsWith(
    FORTY_TWO_CURSUS_COALITION_PREFIX
  );
}

function isCampusCursusCoalition(coalition, campusSlug) {
  const slug = readCoalitionSlug(coalition);

  return Boolean(
    campusSlug &&
      slug?.startsWith(`${FORTY_TWO_CURSUS_COALITION_PREFIX}${campusSlug}-`)
  );
}

function isPiscineCoalition(coalition) {
  const slug = readCoalitionSlug(coalition);
  const name = readString(coalition?.name)?.toLowerCase() ?? "";

  return Boolean(slug?.includes("piscine") || name.includes("piscine"));
}

export function getAuthCallbackUrl(origin) {
  return new URL(AUTH_CALLBACK_PATH, origin).toString();
}

export function getFortyTwoLogin(user) {
  const identityData = user?.identities?.[0]?.identity_data ?? {};
  const metadata = user?.user_metadata ?? {};
  const merged = { ...identityData, ...metadata };

  for (const key of LOGIN_KEYS) {
    const value = readPath(merged, key);

    if (typeof value === "string" && value.trim()) {
      return normalizeLogin(value);
    }
  }

  if (typeof user?.email === "string" && user.email.includes("@")) {
    return normalizeLogin(user.email);
  }

  return null;
}

export function getFortyTwoProfileId(profile) {
  const value = profile?.id;
  const id = typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isSafeInteger(id) ? id : null;
}

function getBooleanProfileValue(profile, key) {
  return typeof profile?.[key] === "boolean" ? profile[key] : null;
}

function getNumberProfileValue(profile, key) {
  const value = profile?.[key];
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
}

export function getFortyTwoProfileImageUrl(profile) {
  return readString(
    readFirst(profile, [
      "image.versions.medium",
      "image.versions.large",
      "image.link",
      "image.versions.small",
      "image.versions.micro",
      "avatar_url",
      "picture",
    ])
  );
}

export function getFortyTwoDisplayName(profile) {
  return readString(
    readFirst(profile, [
      "usual_full_name",
      "displayname",
      "name",
      "full_name",
      "login",
    ])
  );
}

export function getFortyTwoPrimaryCampus(profile) {
  const campusList = Array.isArray(profile?.campus) ? profile.campus : [];
  const campusUsers = Array.isArray(profile?.campus_users)
    ? profile.campus_users
    : [];
  const primaryCampusId = campusUsers.find((item) => item?.is_primary)?.campus_id;

  return (
    campusList.find((campus) => campus?.id === primaryCampusId) ??
    campusList[0] ??
    null
  );
}

export function getFortyTwoPrimaryCursus(profile) {
  const cursusUsers = Array.isArray(profile?.cursus_users)
    ? profile.cursus_users
    : [];

  return (
    cursusUsers.find(
      (item) => !item?.end_at && item?.cursus?.slug === "42"
    ) ??
    cursusUsers.find((item) => !item?.end_at) ??
    cursusUsers[0] ??
    null
  );
}

export function getFortyTwoProfileTimeZone(profile) {
  return readString(getFortyTwoPrimaryCampus(profile)?.time_zone);
}

export function getPlayerFortyTwoTimeZone(player) {
  return (
    readString(player?.campus_time_zone) ??
    getFortyTwoProfileTimeZone(player?.forty_two_profile) ??
    undefined
  );
}

export function selectFortyTwoPrimaryCoalition(coalitions, profile) {
  const items = Array.isArray(coalitions) ? coalitions.filter(Boolean) : [];
  const campus = getFortyTwoPrimaryCampus(profile);
  const campusSlug = slugifyText(campus?.name ?? campus?.city);

  return (
    items.find((coalition) =>
      isCampusCursusCoalition(coalition, campusSlug)
    ) ??
    items.find(isFortyTwoCursusCoalition) ??
    items.find((coalition) => !isPiscineCoalition(coalition)) ??
    items[0] ??
    null
  );
}

export function buildFortyTwoCoalitionPatch(coalition) {
  const syncedAt = new Date().toISOString();

  if (!coalition) {
    return {
      coalition_color: null,
      coalition_cover_url: null,
      coalition_id: null,
      coalition_image_url: null,
      coalition_name: null,
      coalition_slug: null,
      coalition_synced_at: syncedAt,
    };
  }

  return {
    coalition_color: readString(coalition.color),
    coalition_cover_url: readString(coalition.cover_url),
    coalition_id: getNumberProfileValue(coalition, "id"),
    coalition_image_url: readString(coalition.image_url),
    coalition_name: readString(coalition.name),
    coalition_slug: readString(coalition.slug),
    coalition_synced_at: syncedAt,
  };
}

export function buildFortyTwoProfilePatch(profile, coalition) {
  const coalitionPatch =
    coalition === undefined ? {} : buildFortyTwoCoalitionPatch(coalition);

  if (!profile) return coalitionPatch;

  const campus = getFortyTwoPrimaryCampus(profile);
  const cursus = getFortyTwoPrimaryCursus(profile);
  const fortyTwoId = getFortyTwoProfileId(profile);
  const patch = {
    ...coalitionPatch,
    display_name: getFortyTwoDisplayName(profile),
    profile_image_url: getFortyTwoProfileImageUrl(profile),
    profile_url: readString(profile.url),
    forty_two_profile: profile,
    forty_two_profile_updated_at: new Date().toISOString(),
    campus_id: getNumberProfileValue(campus, "id"),
    campus_name: readString(campus?.name ?? campus?.city),
    campus_time_zone: readString(campus?.time_zone),
    correction_point: getNumberProfileValue(profile, "correction_point"),
    cursus_grade: readString(cursus?.grade),
    cursus_id: getNumberProfileValue(cursus, "cursus_id"),
    cursus_level: getNumberProfileValue(cursus, "level"),
    cursus_name: readString(cursus?.cursus?.name ?? cursus?.cursus?.slug),
    intra_location: readString(profile.location),
    is_active: getBooleanProfileValue(profile, "active?"),
    is_alumni: getBooleanProfileValue(profile, "alumni?"),
    is_staff: getBooleanProfileValue(profile, "staff?"),
    kind: readString(profile.kind),
    pool_month: readString(profile.pool_month),
    pool_year: readString(profile.pool_year),
    wallet: getNumberProfileValue(profile, "wallet"),
  };

  if (fortyTwoId) {
    patch.forty_two_id = fortyTwoId;
  }

  return patch;
}

export async function fetchFortyTwoProfile(providerToken) {
  if (!providerToken) return null;

  const response = await fetch(FORTY_TWO_ME_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${providerToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`42 profile request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchFortyTwoUserCoalitions(login) {
  if (!login) return [];

  const token = await getFortyTwoAppToken();
  const response = await fetch(
    `${FORTY_TWO_API_BASE_URL}/v2/users/${encodeURIComponent(login)}/coalitions`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`42 coalitions request failed: ${response.status}`);
  }

  const coalitions = await response.json();

  return Array.isArray(coalitions) ? coalitions : [];
}

export async function fetchFortyTwoPrimaryCoalition(login, profile) {
  const coalitions = await fetchFortyTwoUserCoalitions(login);

  return selectFortyTwoPrimaryCoalition(coalitions, profile);
}

export async function fetchFortyTwoPublicProfile(login) {
  if (!login) return null;

  const token = await getFortyTwoAppToken();
  const response = await fetch(
    `${FORTY_TWO_API_BASE_URL}/v2/users/${encodeURIComponent(login)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`42 public profile request failed: ${response.status}`);
  }

  return response.json();
}
