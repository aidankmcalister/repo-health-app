import { auth } from "@/app/lib/auth";
import { headers } from "next/headers";

/** Reads the Better-Auth session for the current request (RSC / route / action). */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Returns the signed-in user or throws. Use in writes that require auth. */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Not authenticated.");
  }
  return session.user;
}
