import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";
import type { Database } from "@/lib/supabase/database.types";

const intlMiddleware = createIntlMiddleware(routing);

/** Routes that require a signed-in user. Checked against the path with its locale prefix stripped. */
const PROTECTED_PATHS = ["/dashboard", "/profile", "/rooms"];

/** Strips the leading `/en` or `/ar` segment so guard checks are locale-agnostic. */
function withoutLocalePrefix(pathname: string): string {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return "/" + rest.join("/");
  }
  return pathname;
}

function isProtectedPath(pathname: string): boolean {
  const bare = withoutLocalePrefix(pathname) || "/";
  return PROTECTED_PATHS.some(
    (path) => bare === path || bare.startsWith(`${path}/`),
  );
}

export default async function proxy(request: NextRequest) {
  // Let next-intl resolve the locale and produce its base response first
  // (locale negotiation, redirects for missing prefixes, etc). We then
  // layer Supabase's cookie refresh on top of whatever it returns, instead
  // of constructing a second, competing NextResponse.
  const response = intlMiddleware(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase isn't configured yet in this environment — skip auth entirely
  // rather than throwing, so the rest of the site keeps working.
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // `getUser()` re-validates the token against the Auth server, unlike
  // `getSession()` which trusts the cookie as-is — required for an
  // authorization decision. See @supabase/ssr docs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(request.nextUrl.pathname)) {
    const [, maybeLocale] = request.nextUrl.pathname.split("/");
    const locale = (routing.locales as readonly string[]).includes(
      maybeLocale,
    )
      ? maybeLocale
      : routing.defaultLocale;

    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
