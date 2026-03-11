import { NextResponse } from "next/server";
import { getSignedUrlForKey } from "@/lib/r2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "missing_key" }, { status: 400 });
  }

  if (key.startsWith("/pdfs/")) {
    return NextResponse.redirect(new URL(key, request.url));
  }

  const signedUrl = await getSignedUrlForKey({
    key,
    expiresInSeconds: 60 * 60,
  });

  return NextResponse.redirect(signedUrl);
}
