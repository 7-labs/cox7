import packageJson from "@/package.json";
import { site } from "@/lib/c7-data";
import { getInventoryStats } from "@/lib/inventory";
import { pgrstHead } from "@/lib/supabase-rest";

export type RuntimeMode = "ready" | "degraded" | "seed";

export type RuntimeReadiness =
  | "ready"
  | "seed_mode"
  | "supabase_unreachable"
  | "missing_inventory_run"
  | "stale_inventory";

export async function getRuntimeStatus() {
  const inventorySource = process.env.INVENTORY_SOURCE || "supabase";
  let supabaseReachable = false;

  if (inventorySource !== "seed") {
    try {
      await pgrstHead("videos?select=video_id&limit=0");
      supabaseReachable = true;
    } catch {
      supabaseReachable = false;
    }
  }

  const stats = await getInventoryStats();
  const lastRunAt = stats.lastRunAt;
  const referenceTime = lastRunAt || stats.latestPublishedAt;
  const staleHours = referenceTime ? Math.round(((Date.now() - new Date(referenceTime).getTime()) / 36e5) * 10) / 10 : null;
  const stale = inventorySource === "seed" ? false : staleHours == null || staleHours > 30;
  const ok = inventorySource === "seed" ? true : supabaseReachable && !stale;
  const mode: RuntimeMode = inventorySource === "seed" ? "seed" : ok ? "ready" : "degraded";
  const readiness: RuntimeReadiness = ok
    ? inventorySource === "seed"
      ? "seed_mode"
      : "ready"
    : !supabaseReachable
      ? "supabase_unreachable"
      : staleHours == null
        ? "missing_inventory_run"
        : "stale_inventory";
  const servingFallback = stats.source === "seed";
  const userImpact = ok
    ? inventorySource === "seed"
      ? "site_serving_seed_results"
      : "fresh_inventory_available"
    : servingFallback
      ? "site_serving_seed_results"
      : "inventory_not_ready";

  return {
    ok,
    status: ok ? 200 : 503,
    mode,
    readiness,
    servingFallback,
    userImpact,
    stale,
    inventorySource,
    inventoryStatsSource: stats.source,
    supabaseReachable: inventorySource === "seed" ? null : supabaseReachable,
    inventoryTotal: stats.total,
    perLeague: stats.perLeague,
    latestPublishedAt: stats.latestPublishedAt,
    lastRunAt: stats.lastRunAt,
    lastRunStatus: stats.lastRunStatus,
    staleHours,
    siteUrl: site.url,
    version: packageJson.version
  };
}
