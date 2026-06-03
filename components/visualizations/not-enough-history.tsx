/** Shown when a time-series chart has fewer than two data points. */
export function NotEnoughHistory() {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      Not enough history yet — sync over time to chart this.
    </p>
  );
}
