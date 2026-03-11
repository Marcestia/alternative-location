import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminToken = process.env.ADMIN_TOKEN ?? "change-me";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("al_admin");
  if (cookie?.value === adminToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  if (searchParams.toString()) {
    loginUrl.search = `from=${encodeURIComponent(pathname)}&${searchParams.toString()}`;
  } else {
    loginUrl.search = `from=${encodeURIComponent(pathname)}`;
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
