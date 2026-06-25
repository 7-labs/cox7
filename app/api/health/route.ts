import { NextResponse } from "next/server";
import { getRuntimeStatus } from "@/lib/runtime-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = await getRuntimeStatus();

  // Machine health endpoint: mirror runtime.status as the HTTP status so
  // monitors can alert on stale or unavailable inventory without parsing JSON.
  return NextResponse.json(
    runtime,
    {
      status: runtime.status,
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
