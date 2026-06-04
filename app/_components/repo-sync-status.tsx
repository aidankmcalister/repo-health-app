"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DOT_MS = 450;
const POLL_MS = 4000;
const MAX_POLLS = 30; // ~2 min, then stop polling

type RepoSyncStatusProps = {
  backfilledAt: number | null;
  lastSyncedAt: number | null;
};

/** Shows "Backfilling…" (animated) until backfill finishes, then "Synced …". */
export function RepoSyncStatus({
  backfilledAt,
  lastSyncedAt,
}: RepoSyncStatusProps) {
  const router = useRouter();
  const backfilling = backfilledAt === null && lastSyncedAt !== null;
  const [dots, setDots] = useState(3);

  useEffect(() => {
    if (!backfilling) return;
    const tick = () => setDots((current) => (current % 3) + 1);
    const id = setInterval(tick, DOT_MS);
    return () => clearInterval(id);
  }, [backfilling]);

  useEffect(() => {
    if (!backfilling) return;
    let polls = 0;
    const id = setInterval(() => {
      polls += 1;
      router.refresh();
      if (polls >= MAX_POLLS) clearInterval(id);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [backfilling, router]);

  if (backfilling) {
    return <span className="tabular-nums">Backfilling{".".repeat(dots)}</span>;
  }
  if (lastSyncedAt === null) return <span>Not synced</span>;

  const date = new Date(lastSyncedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return <span>Synced {date}</span>;
}
