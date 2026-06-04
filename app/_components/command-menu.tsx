"use client";

import { signOut } from "@/app/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { House, LayoutDashboard, LogOut, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const OPEN_EVENT = "tendril:command-menu";

type DashboardSummary = { id: string; name: string };

/** ⌘K command palette: jump to dashboards and run quick actions. */
export function CommandMenu({ dashboards }: { dashboards: DashboardSummary[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const run = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search dashboards or run a command…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => run(() => router.push("/"))}>
            <House />
            Dashboards
          </CommandItem>
          {dashboards.map((dashboard) => (
            <CommandItem
              key={dashboard.id}
              value={`dashboard ${dashboard.name}`}
              onSelect={() => run(() => router.push(`/dashboard/${dashboard.id}`))}
            >
              <LayoutDashboard />
              {dashboard.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => router.push("/"))}>
            <Plus />
            New dashboard
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => {
                void signOut().then(() => router.refresh());
              })
            }
          >
            <LogOut />
            Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Header pill that opens the command palette (also reachable via ⌘K). */
export function CommandMenuButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="ml-auto gap-2 text-muted-foreground"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
    >
      <Search className="size-4" />
      <span className="hidden sm:inline">Search</span>
      <CommandShortcut className="hidden sm:inline">⌘K</CommandShortcut>
    </Button>
  );
}
