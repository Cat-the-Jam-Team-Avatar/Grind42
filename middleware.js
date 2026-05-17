import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware that refreshes the Supabase session on every matched request.
 * If the refresh token is invalid/expired, the auth cookies are cleared so the
 * user is redirected to the login page instead of seeing repeated errors.
 */
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (pairs) => {
          pairs.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.getUser();

  // If the refresh token is invalid, clear all Supabase auth cookies so the
  // user starts with a clean slate on the next request.
  if (error?.code === "refresh_token_not_found" || error?.code === "session_not_found") {
    const cookieNames = request.cookies
      .getAll()
      .map((c) => c.name)
      .filter((n) => n.startsWith("sb-"));

    cookieNames.forEach((name) => {
      response.cookies.delete(name);
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, robots.txt, sitemap.xml (metadata files)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
