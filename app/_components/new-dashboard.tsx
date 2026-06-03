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
          className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-5" />
          <span className="text-sm">New dashboard</span>
        </button>
      )}
      <DashboardDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
}
