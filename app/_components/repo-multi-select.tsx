"use client";

import { listImportableRepos, lookupImportableRepo } from "@/app/actions/repos";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccessibleRepo } from "@/lib/github/repos";
import { parseRepoRef } from "@/lib/parse-repo";
import { Check, Lock, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SelectedRepo = {
  owner: string;
  name: string;
  nameWithOwner: string;
};

type RepoMultiSelectProps = {
  selected: SelectedRepo[];
  onChange: (next: SelectedRepo[]) => void;
};

/** Picks repos for a dashboard: a grouped list of selected repos plus an
 * inline "Add repo" panel that searches all accessible repos, with custom add. */
export function RepoMultiSelect({ selected, onChange }: RepoMultiSelectProps) {
  const [repos, setRepos] = useState<AccessibleRepo[] | null>(null);
  const [customRepos, setCustomRepos] = useState<AccessibleRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    listImportableRepos().then((result) => {
      if (!active) return;
      if (result.ok && result.repos) setRepos(result.repos);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const known = useMemo(() => {
    const byName = new Map<string, AccessibleRepo>();
    for (const repo of repos ?? []) byName.set(repo.nameWithOwner, repo);
    for (const repo of customRepos) byName.set(repo.nameWithOwner, repo);
    return byName;
  }, [repos, customRepos]);

  const selectedKeys = useMemo(
    () => new Set(selected.map((repo) => repo.nameWithOwner)),
    [selected],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = repos ?? [];
    return q
      ? all.filter((repo) => repo.nameWithOwner.toLowerCase().includes(q))
      : all;
  }, [repos, query]);

  function add(repo: SelectedRepo) {
    if (!selectedKeys.has(repo.nameWithOwner)) onChange([...selected, repo]);
  }

  function remove(nameWithOwner: string) {
    onChange(selected.filter((repo) => repo.nameWithOwner !== nameWithOwner));
  }

  function toggle(repo: AccessibleRepo) {
    if (selectedKeys.has(repo.nameWithOwner)) {
      remove(repo.nameWithOwner);
    } else {
      add({ owner: repo.owner, name: repo.name, nameWithOwner: repo.nameWithOwner });
    }
  }

  function addCustom(repo: AccessibleRepo) {
    setCustomRepos((current) =>
      current.some((r) => r.nameWithOwner === repo.nameWithOwner)
        ? current
        : [repo, ...current],
    );
    add({ owner: repo.owner, name: repo.name, nameWithOwner: repo.nameWithOwner });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" ref={pickerRef}>
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => setOpen((value) => !value)}
        >
          <Plus className="size-4" />
          Add repo
        </Button>

        {open ? (
          <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-80 rounded-md border bg-popover text-popover-foreground shadow-md">
            <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search repos…"
                className="h-9 pl-8"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto p-1">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading your repos…
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No repos found.
              </p>
            ) : (
              filtered.map((repo) => (
                <button
                  key={repo.nameWithOwner}
                  type="button"
                  onClick={() => toggle(repo)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
                >
                  <RepoIdentity repo={repo} />
                  <Check
                    className={
                      selectedKeys.has(repo.nameWithOwner)
                        ? "ml-auto size-4 opacity-100"
                        : "ml-auto size-4 opacity-0"
                    }
                  />
                </button>
              ))
            )}
          </div>

            <CustomRepoRow onAdd={addCustom} />
          </div>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">
          No repos yet. Add some above.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {selected.map((repo) => (
            <li
              key={repo.nameWithOwner}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <RepoIdentity repo={known.get(repo.nameWithOwner) ?? repo} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                onClick={() => remove(repo.nameWithOwner)}
              >
                <X className="size-4" />
                <span className="sr-only">Remove {repo.nameWithOwner}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RepoIdentity({
  repo,
}: {
  repo: { owner: string; nameWithOwner: string; avatarUrl?: string; isPrivate?: boolean };
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Avatar className="size-6">
        <AvatarImage
          src={repo.avatarUrl || `https://github.com/${repo.owner}.png`}
          alt=""
        />
        <AvatarFallback>{repo.owner.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="truncate font-mono text-[13px]">{repo.nameWithOwner}</span>
      {repo.isPrivate ? (
        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
      ) : null}
    </div>
  );
}

function CustomRepoRow({ onAdd }: { onAdd: (repo: AccessibleRepo) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleAdd() {
    const parsed = parseRepoRef(value);
    if (!parsed) {
      setError("Enter a repo as owner/name or a GitHub URL.");
      return;
    }
    setError(null);
    setIsPending(true);
    const result = await lookupImportableRepo(parsed.owner, parsed.name);
    setIsPending(false);
    if (result.ok && result.repo) {
      onAdd(result.repo);
      setValue("");
    } else {
      setError(result.error ?? "Failed to look up repo.");
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex flex-col gap-1 border-t p-2">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="owner/name or GitHub URL"
          className="h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={isPending}
        >
          {isPending ? "Adding…" : "Add"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
