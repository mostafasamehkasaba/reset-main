import type { NextRequest } from "next/server";
import { proxy as appProxy } from "./app/proxy";

export function proxy(request: NextRequest) {
  return appProxy(request);
}

export const config = {
  matcher: ["/", "/projects-pages/:path*", "/auth/login", "/auth/register"],
};
