import { NextResponse } from "next/server";
import { getRuntimeStatus } from "@/lib/runtime-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = await getRuntimeStatus();

  // Operator endpoint: always return 200 and carry the full runtime payload so
  // humans and dashboards can inspect a degraded state without an HTTP failure.
  return NextResponse.json(
    {
      ...runtime,
      statusEndpoint: "operator"
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
