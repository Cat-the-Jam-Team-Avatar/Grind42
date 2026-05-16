export const FORTY_TWO_API_BASE_URL = "https://api.intra.42.fr";

const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

let cachedAppToken = null;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} env var is required`);
  }

  return value;
}

export async function getFortyTwoAppToken() {
  if (
    cachedAppToken &&
    cachedAppToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()
  ) {
    return cachedAppToken.accessToken;
  }

  const res = await fetch(`${FORTY_TWO_API_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: getRequiredEnv("FT_API_CLIENT_ID"),
      client_secret: getRequiredEnv("FT_API_CLIENT_SECRET"),
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error("42 API token request failed");

  const { access_token: accessToken, expires_in: expiresIn = 7200 } =
    await res.json();

  cachedAppToken = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return accessToken;
}
