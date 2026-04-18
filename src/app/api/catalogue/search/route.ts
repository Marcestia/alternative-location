import { NextResponse } from "next/server";

import { searchCatalogSemantically } from "@/lib/catalogSemanticSearch";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get("q") || "").trim();
  const limitParam = Number(searchParams.get("limit") || 18);
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(limitParam, 36))
    : 18;

  if (!query) {
    return NextResponse.json({ mode: "none", itemIds: [] });
  }

  try {
    const result = await searchCatalogSemantically(query, limit);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Semantic catalogue search failed", error);
    return NextResponse.json(
      {
        mode: "unavailable",
        itemIds: [],
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
