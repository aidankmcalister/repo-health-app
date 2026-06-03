"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardSummary = { id: string; name: string };

export function Breadcrumbs({ dashboards }: { dashboards: DashboardSummary[] }) {
  const pathname = usePathname();
  const dashboardId = pathname.startsWith("/dashboard/")
    ? pathname.split("/")[2]
    : null;
  const current = dashboardId
    ? dashboards.find((dashboard) => dashboard.id === dashboardId)
    : null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {dashboardId ? (
            <BreadcrumbLink asChild>
              <Link href="/">Dashboards</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Dashboards</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {dashboardId ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{current?.name ?? "Dashboard"}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
