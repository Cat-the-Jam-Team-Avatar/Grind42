import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  FORTY_TWO_PROVIDER,
  FORTY_TWO_SCOPES,
  getAuthCallbackUrl,
} from "@/lib/auth/forty-two";

function redirectToLogin(request, reason) {
  const url = new URL("/", request.url);
  url.searchParams.set("auth_error", reason);
  return NextResponse.redirect(url);
}

export async function GET(request) {
  try {
    const supabase = await createServerClient();
    const origin = new URL(request.url).origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: FORTY_TWO_PROVIDER,
      options: {
        redirectTo: getAuthCallbackUrl(origin),
        scopes: FORTY_TWO_SCOPES,
      },
    });

    if (error || !data?.url) {
      return redirectToLogin(request, "provider_start_failed");
    }

    return NextResponse.redirect(data.url);
  } catch {
    return redirectToLogin(request, "provider_start_failed");
  }
}
