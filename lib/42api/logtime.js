// Fetches the previous day's logtime (in hours) for a given intra login.
// Requires FT_API_CLIENT_ID and FT_API_CLIENT_SECRET env vars.

async function getBearerToken() {
  const res = await fetch("https://api.intra.42.fr/oauth/token", {
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

export async function fetchYesterdayLogtime(login) {
  const token = await getBearerToken();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  const res = await fetch(
    `https://api.intra.42.fr/v2/users/${login}/locations_stats?begin_at=${dateStr}&end_at=${dateStr}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return 0;

  const data = await res.json();
  const totalSeconds = Object.values(data).reduce((acc, val) => acc + (val ?? 0), 0);
  return totalSeconds / 3600;
}
