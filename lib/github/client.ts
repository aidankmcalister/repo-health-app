import prisma from "@/app/lib/prisma";

/**
 * Reads a user's GitHub OAuth access token from the Account table.
 * Better-Auth stores OAuth credentials there, one row per (userId, providerId).
 * Ported from tendrils-v2 packages/api/src/github/client.ts (ORPCError -> Error).
 */
export async function getGithubAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });

  if (!account?.accessToken) {
    throw new Error("No GitHub access token on file for this user.");
  }

  return account.accessToken;
}

type GraphqlError = { message: string };

type GraphqlResponse<T> = {
  data?: T;
  errors?: GraphqlError[];
};

/**
 * POSTs a GraphQL query to the GitHub API with the given user token.
 * Throws on a non-2xx response, a non-empty `errors[]`, or missing `data`.
 */
export async function githubGraphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "tendril",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub responded with ${response.status} ${response.statusText}.`,
    );
  }

  const json = (await response.json()) as GraphqlResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors.map((error) => error.message).join("; "));
  }

  if (!json.data) {
    throw new Error("GitHub returned no data.");
  }

  return json.data;
}
