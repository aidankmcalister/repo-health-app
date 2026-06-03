import { backfillMissingRepos } from "@/lib/github/backfill";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * One-off backfill endpoint: reconstructs history for repos that were never
 * backfilled. Guarded by CRON_SECRET via the Authorization header, same as the
 * cron route. Idempotent — already-backfilled repos are skipped.
 */
async function handle(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await backfillMissingRepos();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Backfill failed." },
      { status: 500 },
    );
  }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest): Promise<Response> {
  return handle(req);
}

export async function GET(req: NextRequest): Promise<Response> {
  return handle(req);
}
