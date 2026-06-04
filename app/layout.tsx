import { AppSidebar } from "@/app/_components/app-sidebar";
import { Breadcrumbs } from "@/app/_components/breadcrumbs";
import { CommandMenu } from "@/app/_components/command-menu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getDashboardsForUser } from "@/lib/queries";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { JetBrains_Mono, Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

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
      suppressHydrationWarning
      className={cn("font-sans", roboto.variable, jetbrainsMono.variable)}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
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
          <Toaster position="bottom-right" />
        </ThemeProvider>
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
        dashboards={dashboards.map(({ id, name, views }) => ({
          id,
          name,
          count: views.length,
        }))}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--hairline)] bg-[var(--canvas)] px-4">
          <SidebarTrigger className="-ml-1 text-[var(--ink-subtle)]" />
          <Breadcrumbs
            dashboards={dashboards.map(({ id, name }) => ({ id, name }))}
          />
        </header>
        {children}
      </SidebarInset>
      <CommandMenu dashboards={dashboards.map(({ id, name }) => ({ id, name }))} />
    </SidebarProvider>
  );
}
