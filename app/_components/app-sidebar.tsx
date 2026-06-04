"use client";

import { DashboardDialog } from "@/app/_components/dashboard-dialog";
import { SettingsDialog } from "@/app/_components/settings-dialog";
import { signOut } from "@/app/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Sprout,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type DashboardSummary = { id: string; name: string; count: number };

type AppSidebarProps = {
  dashboards: DashboardSummary[];
  userName: string;
  userEmail: string;
  userImage: string | null;
};

export function AppSidebar({
  dashboards,
  userName,
  userEmail,
  userImage,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [newDashboardOpen, setNewDashboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <>
      <Sidebar className="border-[var(--hairline)] bg-[var(--canvas)]">
        <SidebarHeader className="gap-3 px-3 pt-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md px-1 py-1"
          >
            <span className="flex size-6 items-center justify-center rounded-[7px] border border-[color-mix(in_srgb,var(--primary)_34%,transparent)] bg-[color-mix(in_srgb,var(--primary)_16%,var(--surface-1))] text-primary">
              <Sprout className="size-[15px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.4px] text-foreground">
              Tendril
            </span>
            <ChevronsUpDown className="ml-auto size-3.5 text-[var(--ink-tertiary)]" />
          </Link>

          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("tendril:command-menu"))
            }
            className="flex h-9 items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface-1)] px-3 text-[var(--ink-subtle)] transition-colors hover:border-[var(--hairline-strong)]"
          >
            <Search className="size-[15px]" />
            <span className="flex-1 text-left text-sm">Search</span>
            <span className="rounded border border-[var(--hairline)] px-1.5 py-px font-mono text-[11px] text-[var(--ink-tertiary)]">
              ⌘K
            </span>
          </button>
        </SidebarHeader>

        <SidebarContent className="px-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-2 pb-1.5 pt-4">
              <span className="text-[11px] font-medium tracking-[0.4px] text-[var(--ink-tertiary)]">
                DASHBOARDS
              </span>
              <button
                type="button"
                title="New dashboard"
                onClick={() => setNewDashboardOpen(true)}
                className="flex size-5 items-center justify-center rounded text-[var(--ink-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-foreground"
              >
                <Plus className="size-3.5" />
                <span className="sr-only">New dashboard</span>
              </button>
            </div>

            {dashboards.length === 0 ? (
              <p className="px-2 py-1 text-[13px] text-[var(--ink-tertiary)]">
                No dashboards yet.
              </p>
            ) : (
              dashboards.map((dashboard) => {
                const active = pathname === `/dashboard/${dashboard.id}`;
                return (
                  <Link
                    key={dashboard.id}
                    href={`/dashboard/${dashboard.id}`}
                    className={cn(
                      "flex h-8 items-center gap-2.5 rounded-md px-2 text-[13.5px] transition-colors",
                      active
                        ? "bg-secondary text-foreground"
                        : "text-[var(--ink-muted)] hover:bg-[var(--surface-1)] hover:text-foreground",
                    )}
                  >
                    <LayoutDashboard
                      className={cn(
                        "size-3.5 shrink-0",
                        active ? "text-primary" : "text-[var(--ink-tertiary)]",
                      )}
                    />
                    <span className="flex-1 truncate text-left">
                      {dashboard.name}
                    </span>
                    <span className="font-mono text-[10.5px] text-[var(--ink-tertiary)]">
                      {dashboard.count}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </SidebarContent>

        <SidebarFooter className="gap-2 px-3 pb-3">
          <div className="flex items-center gap-2 px-2 font-mono text-[11.5px] text-[var(--ink-subtle)]">
            <span>
              Press <span className="text-foreground">⌘K</span> for commands
            </span>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-[var(--surface-1)] data-[state=open]:bg-[var(--surface-1)]"
                  >
                    <UserIdentity
                      name={userName}
                      email={userEmail}
                      image={userImage}
                    />
                    <ChevronsUpDown className="ml-auto size-4 text-[var(--ink-tertiary)]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5">
                      <UserIdentity
                        name={userName}
                        email={userEmail}
                        image={userImage}
                      />
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={handleSignOut}
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <DashboardDialog
        mode="create"
        open={newDashboardOpen}
        onOpenChange={setNewDashboardOpen}
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function UserIdentity({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  return (
    <>
      <Avatar className="size-8 rounded-md">
        <AvatarImage src={image ?? undefined} alt={name} />
        <AvatarFallback className="rounded-md">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left leading-tight">
        <span className="truncate text-[13px] font-medium text-foreground">
          {name}
        </span>
        <span className="truncate font-mono text-[11px] text-[var(--ink-subtle)]">
          {email}
        </span>
      </div>
    </>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
