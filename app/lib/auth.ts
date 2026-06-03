import prisma from "./prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export function createAuth() {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        scope: ["read:user", "user:email", "read:org", "repo"],
      },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    // Single same-origin Next app: Better-Auth's default cookie attributes
    // (sameSite: lax, secure only in production) work as-is. v2 forced
    // sameSite:none + secure:true because its web/server were split origins,
    // which would break sign-in over http://localhost here.
    plugins: [],
  });
}

export const auth = createAuth();
