import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-auth eagerly imports its kysely adapter during init. Bundling that
  // graph trips over kysely's dual CJS/ESM export of DEFAULT_MIGRATION_TABLE.
  // Keeping these server-only packages external lets Node resolve them at
  // runtime, which works correctly. We use the Prisma adapter, not kysely.
  serverExternalPackages: [
    "better-auth",
    "@better-auth/kysely-adapter",
    "kysely",
  ],
};

export default nextConfig;
