import { NextResponse } from "next/server";
import packageJson from "@/package.json";
import { site } from "@/lib/c7-data";
import { getInventoryStats } from "@/lib/inventory";
import { pgrstHead } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  const inventorySource = process.env.INVENTORY_SOURCE || "supabase";
  let supabaseReachable = false;

  try {
    await pgrstHead("videos?select=video_id&limit=0");
    supabaseReachable = true;
  } catch {
    supabaseReachable = false;
  }

  const stats = await getInventoryStats();
  const lastRunAt = stats.lastRunAt;
  const referenceTime = lastRunAt || stats.latestPublishedAt;
  const staleHours = referenceTime ? Math.round(((Date.now() - new Date(referenceTime).getTime()) / 36e5) * 10) / 10 : null;
  const stale = inventorySource === "seed" ? false : staleHours == null || staleHours > 30;
  const ok = inventorySource === "seed" ? true : supabaseReachable && !stale;
  const status = ok ? 200 : 503;

  return NextResponse.json(
    {
      ok,
      stale,
      inventorySource,
      supabaseReachable,
      inventoryTotal: stats.total,
      latestPublishedAt: stats.latestPublishedAt,
      lastRunAt: stats.lastRunAt,
      lastRunStatus: stats.lastRunStatus,
      staleHours,
      siteUrl: site.url,
      version: packageJson.version
    },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
