"use client";

import { syncDashboardNow } from "@/app/actions/dashboards";
import { Button } from "@/components/ui/button";
import { SYNC_COOLDOWN_MS } from "@/lib/cooldown";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type SyncNowButtonProps = {
  dashboardId: string;
  lastSyncedAt: number | null;
};

/** Triggers a manual sync, disabled during the 30-minute cooldown. */
export function SyncNowButton({ dashboardId, lastSyncedAt }: SyncNowButtonProps) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs =
    now !== null && lastSyncedAt !== null
      ? Math.max(0, lastSyncedAt + SYNC_COOLDOWN_MS - now)
      : 0;
  const onCooldown = remainingMs > 0;

  function handleSync() {
    setError(null);
    startTransition(async () => {
      const result = await syncDashboardNow(dashboardId);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to sync.");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
      <Button
        variant="outline"
        onClick={handleSync}
        disabled={isPending || onCooldown}
      >
        <RefreshCw className={isPending ? "size-4 animate-spin" : "size-4"} />
        {isPending
          ? "Syncing…"
          : onCooldown
            ? `Sync in ${Math.ceil(remainingMs / 60000)}m`
            : "Sync now"}
      </Button>
    </div>
  );
}
