import prisma from "@/app/lib/prisma";

// How much snapshot history to load for charts.
const HISTORY_WINDOW_DAYS = 120;

function historyCutoff(): Date {
  return new Date(Date.now() - HISTORY_WINDOW_DAYS * 86_400_000);
}

/** A user's dashboards with their linked repos, cached fields, and recent history. */
export async function getDashboardsForUser(userId: string) {
  return prisma.dashboard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      repos: {
        orderBy: { id: "asc" },
        include: {
          repo: {
            include: {
              snapshots: {
                where: { date: { gte: historyCutoff() } },
                orderBy: { date: "asc" },
              },
            },
          },
        },
      },
      views: { orderBy: { order: "asc" } },
    },
  });
}

/** One dashboard (scoped to its owner) with its repos and snapshot history. */
export async function getDashboardForUser(dashboardId: string, userId: string) {
  return prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    include: {
      repos: {
        orderBy: { id: "asc" },
        include: {
          repo: {
            include: {
              snapshots: {
                where: { date: { gte: historyCutoff() } },
                orderBy: { date: "asc" },
              },
            },
          },
        },
      },
      views: { orderBy: { order: "asc" } },
    },
  });
}
