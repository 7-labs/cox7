import { NextResponse } from "next/server";
import { getRuntimeStatus } from "@/lib/runtime-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = await getRuntimeStatus();

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
