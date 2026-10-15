export default function DivergingBar({
  upvotes,
  downvotes,
}: {
  upvotes: number;
  downvotes: number;
}) {
  const max = Math.max(1, upvotes, downvotes);
  const upPct = (upvotes / max) * 50;
  const downPct = (downvotes / max) * 50;

  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full"
      style={{ background: "var(--diverging-midpoint, #e1e0d9)" }}
    >
      <div
        className="absolute inset-y-0 right-1/2 rounded-l-full"
        style={{
          width: `${downPct}%`,
          background: "#e34948",
        }}
      />
      <div
        className="absolute inset-y-0 left-1/2 rounded-r-full"
        style={{
          width: `${upPct}%`,
          background: "#2a78d6",
        }}
      />
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/60 dark:bg-black/40" />
    </div>
  );
}
