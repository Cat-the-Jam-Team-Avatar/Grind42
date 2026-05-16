export const FORTY_TWO_PROVIDER = "custom:42-school";
export const FORTY_TWO_SCOPES = "public";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const FORTY_TWO_ME_URL = "https://api.intra.42.fr/v2/me";

const LOGIN_KEYS = [
  "login",
  "user_name",
  "preferred_username",
  "nickname",
  "username",
];

function readPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function normalizeLogin(value) {
  const login = value.trim();

  if (login.includes("@")) {
    return login.split("@")[0];
  }

  return login;
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
