import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  DEFAULT_AUTH_REDIRECT,
  LOGIN_PATH,
  REGISTER_PATH,
} from "./lib/constant";

const AUTH_PATHS = new Set([LOGIN_PATH, REGISTER_PATH]);

const isProtectedPath = (pathname: string) => {
  return pathname === DEFAULT_AUTH_REDIRECT || pathname.startsWith("/projects-pages");
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (AUTH_PATHS.has(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }

    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/projects-pages/:path*", "/auth/login", "/auth/register"],
};
