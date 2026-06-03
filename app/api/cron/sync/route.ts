import prisma from "@/app/lib/prisma";
import { syncRepo } from "@/lib/github/sync";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Cron sync endpoint. Guarded by CRON_SECRET via the Authorization header.
 * Loops every tracked repo and records a fresh snapshot. Step 2 wires the
 * Vercel Cron schedule; the route is callable now with the secret.
 */
async function handle(req: NextRequest): Promise<Response> {
  if (!isAuthorized(req)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const repos = await prisma.repo.findMany({ select: { id: true, owner: true, name: true } });
  let synced = 0;
  const skipped: Array<{ repo: string; reason: string }> = [];

  for (const repo of repos) {
    try {
      const ok = await syncRepo(repo.id);
      if (ok) {
        synced++;
      } else {
        skipped.push({ repo: `${repo.owner}/${repo.name}`, reason: "no usable token" });
      }
    } catch (error) {
      skipped.push({
        repo: `${repo.owner}/${repo.name}`,
        reason: error instanceof Error ? error.message : "failed",
      });
    }
  }

  return Response.json({ ok: true, totalRepos: repos.length, synced, skipped });
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest): Promise<Response> {
  return handle(req);
}

// GET allowed too, so it's trivially callable from a browser/curl with the header.
export async function GET(req: NextRequest): Promise<Response> {
  return handle(req);
}
