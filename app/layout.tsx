import { AppSidebar } from "@/app/_components/app-sidebar";
import { Breadcrumbs } from "@/app/_components/breadcrumbs";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getDashboardsForUser } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Tendril",
  description: "A read-only dashboard for watching GitHub repos.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={cn("font-sans", roboto.variable, geistMono.variable)}
    >
      <body className="antialiased">
        <TooltipProvider>
          {session?.user ? (
            <AppShell
              userId={session.user.id}
              userName={session.user.name}
              userEmail={session.user.email}
              userImage={session.user.image ?? null}
            >
              {children}
            </AppShell>
          ) : (
            children
          )}
        </TooltipProvider>
      </body>
    </html>
  );
}

async function AppShell({
  userId,
  userName,
  userEmail,
  userImage,
  children,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  children: React.ReactNode;
}) {
  const dashboards = await getDashboardsForUser(userId);

  return (
    <SidebarProvider>
      <AppSidebar
        dashboards={dashboards.map(({ id, name }) => ({ id, name }))}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumbs
            dashboards={dashboards.map(({ id, name }) => ({ id, name }))}
          />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
