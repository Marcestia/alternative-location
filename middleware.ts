import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminToken = process.env.ADMIN_TOKEN ?? "change-me";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
