import { NextResponse } from "next/server";
import { type LeagueSlug, type PreviewType } from "@/lib/c7-data";
import { isLeagueSlug, isPreviewType, safeQuery } from "@/lib/search";
import { executeSearchRequest } from "@/lib/youtube-search";

export const dynamic = "force-dynamic";

function getClientKey(request: Request) {
  // Prefer Cloudflare's verified client IP. `x-forwarded-for` is client-spoofable
  // on Workers, so it must not be the primary rate-limit key; keep it (and
  // `x-real-ip`) only as fallbacks for non-CF runtimes.
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const candidate = cfConnectingIp?.trim() || forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

  return candidate.slice(0, 120);
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        status === 429
          ? "private, no-store"
          : "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      ...headers
    }
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = safeQuery(searchParams.get("q"));
  const leagueParam = searchParams.get("league");
  const typeParam = searchParams.get("type");
  const league: LeagueSlug | "all" = leagueParam === "all" ? "all" : isLeagueSlug(leagueParam) ? leagueParam : "all";
  const type: PreviewType | "all" = typeParam === "all" ? "all" : isPreviewType(typeParam) ? typeParam : "all";

  const result = await executeSearchRequest({
    query,
    league,
    type,
    apiKey: process.env.YOUTUBE_API_KEY,
    clientKey: getClientKey(request)
  });

  return json(result.body, result.status, result.headers);
}
