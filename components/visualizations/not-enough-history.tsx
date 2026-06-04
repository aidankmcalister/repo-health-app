/** Empty state for charts: no history yet, or history couldn't be backfilled. */
export function NotEnoughHistory({ unavailable }: { unavailable?: boolean }) {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {unavailable
        ? "History unavailable for this metric."
        : "Not enough history yet — sync over time to chart this."}
    </p>
  );
}
