import { NextResponse } from "next/server";
import packageJson from "@/package.json";
import { site } from "@/lib/c7-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: 200,
      mode: "live",
      siteUrl: site.url,
      version: packageJson.version,
      checkedAt: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
