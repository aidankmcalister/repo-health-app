import { githubGraphql } from "./client";

// A repo the signed-in user can import, with the fields the picker UI shows.
export type AccessibleRepo = {
  nameWithOwner: string;
  owner: string;
  name: string;
  avatarUrl: string;
  isPrivate: boolean;
  pushedAt: string | null;
};

type RepoNode = {
  nameWithOwner: string;
  name: string;
  isPrivate: boolean;
  pushedAt: string | null;
  owner: { login: string; avatarUrl: string };
};

type ViewerReposPage = {
  viewer: {
    repositories: {
      nodes: RepoNode[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
};

const LIST_ACCESSIBLE_REPOS_QUERY = /* GraphQL */ `
  query ListAccessibleRepos($cursor: String) {
    viewer {
      repositories(
        first: 100
        after: $cursor
        affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          name
          isPrivate
          pushedAt
          owner {
            login
            avatarUrl
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

function toAccessibleRepo(node: RepoNode): AccessibleRepo {
  return {
    nameWithOwner: node.nameWithOwner,
    owner: node.owner.login,
    name: node.name,
    avatarUrl: node.owner.avatarUrl,
    isPrivate: node.isPrivate,
    pushedAt: node.pushedAt,
  };
}

const LOOKUP_REPO_QUERY = /* GraphQL */ `
  query LookupRepo($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      nameWithOwner
      name
      isPrivate
      pushedAt
      owner {
        login
        avatarUrl
      }
    }
  }
`;

/**
 * Looks up a single repo (e.g. a custom "owner/name") with the user's token.
 * Returns null when the token can't see it.
 */
export async function lookupAccessibleRepo(
  token: string,
  owner: string,
  name: string,
): Promise<AccessibleRepo | null> {
  const data = await githubGraphql<{ repository: RepoNode | null }>(
    token,
    LOOKUP_REPO_QUERY,
    { owner, name },
  );
  return data.repository ? toAccessibleRepo(data.repository) : null;
}

/** Fetches every repository the viewer can access, paginating 100 at a time. */
export async function listAccessibleRepos(
  token: string,
): Promise<AccessibleRepo[]> {
  const repos: AccessibleRepo[] = [];
  let cursor: string | null = null;

  for (;;) {
    const page: ViewerReposPage = await githubGraphql<ViewerReposPage>(
      token,
      LIST_ACCESSIBLE_REPOS_QUERY,
      { cursor },
    );

    for (const node of page.viewer.repositories.nodes) {
      repos.push(toAccessibleRepo(node));
    }

    const { hasNextPage, endCursor } = page.viewer.repositories.pageInfo;
    if (!hasNextPage || !endCursor) {
      break;
    }
    cursor = endCursor;
  }

  return repos;
}
