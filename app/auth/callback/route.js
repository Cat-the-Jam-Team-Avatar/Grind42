import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  buildFortyTwoProfilePatch,
  fetchFortyTwoProfile,
  getFortyTwoLogin,
} from "@/lib/auth/forty-two";

function redirectToLogin(request, reason) {
  const url = new URL("/", request.url);
  url.searchParams.set("auth_error", reason);
  return NextResponse.redirect(url);
}

function getProviderErrorReason(url) {
  const providerError = url.searchParams.get("error");
  const description = url.searchParams.get("error_description");

  if (description?.includes("missing provider id")) {
    return "provider_profile_missing_id";
  }

  return providerError;
}

function getProfileSyncErrorReason(error) {
  if (error?.code === "PGRST205") {
    return "database_schema_missing";
  }

  if (error?.code === "42501") {
    return "database_policy_failed";
  }

  return "profile_sync_failed";
}

function isOptionalProfileColumnError(error) {
  return (
    error?.code === "PGRST204" ||
    error?.message?.includes("forty_two_profile") ||
    error?.message?.includes("forty_two_id")
  );
}

async function upsertPlayerProfile(supabase, user, intraLogin, fortyTwoProfile) {
  const basePayload = { id: user.id, intra_login: intraLogin };

  if (!fortyTwoProfile) {
    return supabase
      .from("users")
      .upsert(basePayload, { onConflict: "id" });
  }

  const payload = {
    ...basePayload,
    ...buildFortyTwoProfilePatch(fortyTwoProfile),
  };

  const result = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" });

  if (!result.error || !isOptionalProfileColumnError(result.error)) {
    return result;
  }

  console.warn(
    "42 profile columns are missing; falling back to minimal profile sync",
    result.error
  );

  return supabase
    .from("users")
    .upsert(basePayload, { onConflict: "id" });
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const providerError = getProviderErrorReason(url);

  if (providerError) {
    return redirectToLogin(request, providerError);
  }

  if (!code) {
    return redirectToLogin(request, "missing_code");
  }

  let supabase;
  let data;

  try {
    supabase = await createServerClient();
    const result = await supabase.auth.exchangeCodeForSession(code);

    data = result.data;

    if (result.error) {
      return redirectToLogin(request, "session_exchange_failed");
    }
  } catch {
    return redirectToLogin(request, "session_exchange_failed");
  }

  const user = data?.user ?? data?.session?.user;
  const intraLogin = getFortyTwoLogin(user);

  if (!user?.id || !intraLogin) {
    return redirectToLogin(request, "missing_42_login");
  }

  let fortyTwoProfile = null;

  try {
    fortyTwoProfile = await fetchFortyTwoProfile(data?.session?.provider_token);
  } catch (error) {
    console.error("42 profile fetch failed", error);
  }

  const { error: profileError } = await upsertPlayerProfile(
    supabase,
    user,
    intraLogin,
    fortyTwoProfile
  );

  if (profileError) {
    console.error("Profile sync failed", profileError);
    return redirectToLogin(request, getProfileSyncErrorReason(profileError));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
