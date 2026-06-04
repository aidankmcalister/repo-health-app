"use client";

import { DashboardDialog } from "@/app/_components/dashboard-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

/** Opens the new-dashboard modal, either as a button or a dashed grid card. */
export function NewDashboard({ variant }: { variant: "button" | "card" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "button" ? (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New dashboard
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--hairline-strong)] bg-[var(--surface-1)] text-[var(--ink-subtle)] transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <span className="flex size-11 items-center justify-center rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] text-[var(--ink-subtle)]">
            <Plus className="size-5" />
          </span>
          <span className="text-sm">New dashboard</span>
        </button>
      )}
      <DashboardDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
