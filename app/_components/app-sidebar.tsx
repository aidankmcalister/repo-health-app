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
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type DashboardSummary = { id: string; name: string };

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
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="px-2 py-1 text-lg font-semibold">
            Tendril
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel
              asChild
              className="cursor-pointer transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Link href="/">Dashboards</Link>
            </SidebarGroupLabel>
            <SidebarGroupAction
              title="New dashboard"
              onClick={() => setNewDashboardOpen(true)}
            >
              <Plus />
              <span className="sr-only">New dashboard</span>
            </SidebarGroupAction>

            <SidebarMenu>
              {dashboards.map((dashboard) => (
                <SidebarMenuItem key={dashboard.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/dashboard/${dashboard.id}`}
                  >
                    <Link href={`/dashboard/${dashboard.id}`}>
                      {dashboard.name}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <UserIdentity
                      name={userName}
                      email={userEmail}
                      image={userImage}
                    />
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleSignOut}>
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
      <Avatar className="size-8 rounded-lg">
        <AvatarImage src={image ?? undefined} alt={name} />
        <AvatarFallback className="rounded-lg">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{name}</span>
        <span className="truncate text-xs text-muted-foreground">{email}</span>
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
