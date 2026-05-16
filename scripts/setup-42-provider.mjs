import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PROVIDER_IDENTIFIER = "custom:42-school";
const PROVIDER_NAME = "42 School";
const PROVIDER_CONFIG = {
  provider_type: "oauth2",
  identifier: PROVIDER_IDENTIFIER,
  name: PROVIDER_NAME,
  authorization_url: "https://api.intra.42.fr/oauth/authorize",
  token_url: "https://api.intra.42.fr/oauth/token",
  userinfo_url: "https://api.intra.42.fr/v2/me",
  scopes: ["public"],
  attribute_mapping: {
    sub: "email",
  },
  email_optional: true,
  enabled: true,
};

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

function getProviderPayload() {
  return {
    ...PROVIDER_CONFIG,
    client_id: requireEnv("FT_API_CLIENT_ID"),
    client_secret: requireEnv("FT_API_CLIENT_SECRET"),
  };
}

function getUpdatePayload(payload) {
  const { provider_type, identifier, ...updatablePayload } = payload;

  return updatablePayload;
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const customProviders = supabase.auth.admin.customProviders;

  if (!customProviders) {
    throw new Error(
      "This installed @supabase/supabase-js version does not expose customProviders."
    );
  }

  const payload = getProviderPayload();
  const { data: listData, error: listError } =
    await customProviders.listProviders();

  if (listError) throw listError;

  const existingProvider = listData?.providers?.find(
    (provider) => provider.identifier === PROVIDER_IDENTIFIER
  );

  if (existingProvider) {
    const { error } = await customProviders.updateProvider(
      PROVIDER_IDENTIFIER,
      getUpdatePayload(payload)
    );

    if (error) throw error;

    console.log(`Updated Supabase provider: ${PROVIDER_IDENTIFIER}`);
  } else {
    const { error } = await customProviders.createProvider(payload);

    if (error) throw error;

    console.log(`Created Supabase provider: ${PROVIDER_IDENTIFIER}`);
  }

  console.log("");
  console.log("Use this as the 42 Intra Redirect URI:");
  console.log(`${new URL(supabaseUrl).origin}/auth/v1/callback`);
  console.log("");
  console.log("Use this as the Supabase local Redirect URL:");
  console.log("http://localhost:3000/auth/callback");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
