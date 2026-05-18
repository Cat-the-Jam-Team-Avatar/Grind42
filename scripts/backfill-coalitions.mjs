import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_LIMIT = 20;
const FORTY_TWO_API_BASE_URL = "https://api.intra.42.fr";
const FORTY_TWO_CURSUS_COALITION_PREFIX = "42cursus-";

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(fileName) {
  const filePath = resolve(fileName);

  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");

    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = stripQuotes(line.slice(separator + 1).trim());

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function readString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value) {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
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

function getPrimaryCampus(profile) {
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

function readCoalitionSlug(coalition) {
  return readString(coalition?.slug)?.toLowerCase() ?? null;
}

function isCampusCursusCoalition(coalition, campusSlug) {
  const slug = readCoalitionSlug(coalition);

  return Boolean(
    campusSlug &&
      slug?.startsWith(`${FORTY_TWO_CURSUS_COALITION_PREFIX}${campusSlug}-`)
  );
}

function isFortyTwoCursusCoalition(coalition) {
  return readCoalitionSlug(coalition)?.startsWith(
    FORTY_TWO_CURSUS_COALITION_PREFIX
  );
}

function isPiscineCoalition(coalition) {
  const slug = readCoalitionSlug(coalition);
  const name = readString(coalition?.name)?.toLowerCase() ?? "";

  return Boolean(slug?.includes("piscine") || name.includes("piscine"));
}

function selectPrimaryCoalition(coalitions, user) {
  const items = Array.isArray(coalitions) ? coalitions.filter(Boolean) : [];
  const campus = getPrimaryCampus(user.forty_two_profile);
  const campusSlug =
    slugifyText(campus?.name ?? campus?.city) ?? slugifyText(user.campus_name);

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

function buildCoalitionPatch(coalition) {
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
    coalition_id: readNumber(coalition.id),
    coalition_image_url: readString(coalition.image_url),
    coalition_name: readString(coalition.name),
    coalition_slug: readString(coalition.slug),
    coalition_synced_at: syncedAt,
  };
}

function parseArgs(argv) {
  const options = {
    apply: false,
    limit: DEFAULT_LIMIT,
    login: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--limit") {
      options.limit = Number.parseInt(argv[index + 1], 10);
      index += 1;
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number.parseInt(arg.slice("--limit=".length), 10);
    } else if (arg === "--login") {
      options.login = argv[index + 1] ?? null;
      index += 1;
    } else if (arg.startsWith("--login=")) {
      options.login = arg.slice("--login=".length);
    }
  }

  if (!Number.isSafeInteger(options.limit) || options.limit < 1) {
    throw new Error("--limit must be a positive integer.");
  }

  return options;
}

async function getFortyTwoAppToken() {
  const response = await fetch(`${FORTY_TWO_API_BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: requireEnv("FT_API_CLIENT_ID"),
      client_secret: requireEnv("FT_API_CLIENT_SECRET"),
    }),
  });

  if (!response.ok) {
    throw new Error(`42 API token request failed: ${response.status}`);
  }

  const body = await response.json();

  return body.access_token;
}

async function fetchUserCoalitions(token, login) {
  const response = await fetch(
    `${FORTY_TWO_API_BASE_URL}/v2/users/${encodeURIComponent(login)}/coalitions`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`42 coalitions request failed for ${login}: ${response.status}`);
  }

  const body = await response.json();

  return Array.isArray(body) ? body : [];
}

async function fetchUsers(supabase, options) {
  let query = supabase
    .from("users")
    .select(
      [
        "id",
        "intra_login",
        "campus_name",
        "forty_two_profile",
      ].join(",")
    )
    .not("intra_login", "is", null)
    .order("intra_login", { ascending: true })
    .limit(options.limit);

  if (options.login) {
    query = query.eq("intra_login", options.login);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const options = parseArgs(process.argv.slice(2));
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  const token = await getFortyTwoAppToken();
  const users = await fetchUsers(supabase, options);
  const results = [];

  for (const user of users) {
    const coalitions = await fetchUserCoalitions(token, user.intra_login);
    const selected = selectPrimaryCoalition(coalitions, user);
    const patch = buildCoalitionPatch(selected);

    if (options.apply) {
      const { error } = await supabase
        .from("users")
        .update(patch)
        .eq("id", user.id);

      if (error) throw error;
    }

    results.push({
      login: user.intra_login,
      selected: patch.coalition_slug,
      selectedName: patch.coalition_name,
      status: options.apply ? "updated" : "dry-run",
    });
  }

  console.log(
    JSON.stringify(
      {
        apply: options.apply,
        count: results.length,
        results,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
