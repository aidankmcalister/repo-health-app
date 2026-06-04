/**
 * Parses a repo reference into { owner, name }. Accepts:
 *   - owner/name
 *   - github.com/owner/name
 *   - https://github.com/owner/name(.git)(/tree/...)(?...#...)
 * Returns null if it can't extract two segments.
 */
export function parseRepoRef(input: string): { owner: string; name: string } | null {
  const value = input.trim();
  if (!value) return null;

  const url = value.match(
    /github\.com[/:]([^/\s]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/i,
  );
  if (url) return { owner: url[1], name: url[2] };

  const parts = value.replace(/^\/+|\/+$/g, "").split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], name: parts[1].replace(/\.git$/, "") };
  }
  return null;
}
