import prisma from "@/app/lib/prisma";

/** A user's dashboards with their linked repos and each repo's cached fields. */
export async function getDashboardsForUser(userId: string) {
  return prisma.dashboard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      repos: {
        orderBy: { id: "asc" },
        include: { repo: true },
      },
      views: { orderBy: { order: "asc" } },
    },
  });
}

/** One dashboard (scoped to its owner) with its repos and recent snapshots. */
export async function getDashboardForUser(dashboardId: string, userId: string) {
  return prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    include: {
      repos: {
        orderBy: { id: "asc" },
        include: {
          repo: {
            include: {
              snapshots: { orderBy: { date: "desc" }, take: 10 },
            },
          },
        },
      },
      views: { orderBy: { order: "asc" } },
    },
  });
}
