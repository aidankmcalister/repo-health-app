"use server";

import { getGithubAccessToken } from "@/lib/github/client";
import {
  listAccessibleRepos,
  lookupAccessibleRepo,
  type AccessibleRepo,
} from "@/lib/github/repos";
import {
  assertOwnedDashboard,
  linkRepo,
  unlinkRepo,
} from "@/lib/dashboard-repos";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Valid characters for a single owner or repo-name segment.
const REPO_PART = /^[A-Za-z0-9._-]+$/;

type ActionResult = { ok: boolean; error?: string };

/**
 * Lists the repos the signed-in user can import (private + public), fetched
 * on demand when the repo picker opens.
 */
export async function listImportableRepos(): Promise<{
  ok: boolean;
  repos?: AccessibleRepo[];
  error?: string;
}> {
  try {
    const user = await requireUser();
    const token = await getGithubAccessToken(user.id);
    const repos = await listAccessibleRepos(token);
    return { ok: true, repos };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to load your repos.") };
  }
}

/**
 * Looks up one repo by "owner/name" with the user's token, for the custom-add
 * row in the picker. Returns the repo so it can be shown with real data.
 */
export async function lookupImportableRepo(
  ownerInput: string,
  nameInput: string,
): Promise<{ ok: boolean; repo?: AccessibleRepo; error?: string }> {
  try {
    const user = await requireUser();
    const owner = ownerInput.trim();
    const name = nameInput.trim();
    if (!REPO_PART.test(owner) || !REPO_PART.test(name)) {
      return { ok: false, error: "Enter a repo as owner/name." };
    }

    const token = await getGithubAccessToken(user.id);
    const repo = await lookupAccessibleRepo(token, owner, name);
    if (!repo) {
      return {
        ok: false,
        error: `Repo ${owner}/${name} not found or not accessible.`,
      };
    }
    return { ok: true, repo };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to look up repo.") };
  }
}

/** Links a single repo to one of the user's dashboards. */
export async function addRepoToDashboard(
  dashboardId: string,
  ownerInput: string,
  nameInput: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();

    const owner = ownerInput.trim();
    const name = nameInput.trim();
    if (!REPO_PART.test(owner) || !REPO_PART.test(name)) {
      return { ok: false, error: "Invalid owner or repo name." };
    }

    await assertOwnedDashboard(dashboardId, user.id);
    await linkRepo(user.id, dashboardId, owner, name);

    revalidatePath(`/dashboard/${dashboardId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to add repo.") };
  }
}

/** Unlinks a repo from one of the user's dashboards. Leaves the shared Repo. */
export async function removeRepoFromDashboard(
  dashboardId: string,
  repoId: string,
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await assertOwnedDashboard(dashboardId, user.id);
    await unlinkRepo(dashboardId, repoId);

    revalidatePath(`/dashboard/${dashboardId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error, "Failed to remove repo.") };
  }
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
