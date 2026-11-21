import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && session.user?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/login") && session.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
