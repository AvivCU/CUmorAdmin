export type Row = Record<string, unknown> & { id: number | string };

export type Column = {
  key: string;
  label: string;
  format?:
    | "text"
    | "truncate"
    | "details"
    | "datetime"
    | "boolean"
    | "mono"
    | "lookup"
    | "status"
    | "share";
  lookup?: Record<string, string>;
  // For "share": the boolean column that decides whether a row counts toward the total.
  activeKey?: string;
};

const STATUS_STYLES: Record<string, string> = {
  completed:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

function shareOf(column: Column, row: Row, rows: Row[]) {
  const counts = (r: Row) => !column.activeKey || r[column.activeKey] === true;
  if (!counts(row)) return "0%";
  const total = rows
    .filter(counts)
    .reduce((sum, r) => sum + Number(r[column.key] ?? 0), 0);
  if (total <= 0) return "0%";
  return `${Math.round((Number(row[column.key] ?? 0) / total) * 100)}%`;
}

export function Cell({
  column,
  row,
  rows,
}: {
  column: Column;
  row: Row;
  rows: Row[];
}) {
  const value = row[column.key];
  const empty = <span className="text-zinc-300 dark:text-zinc-700">—</span>;

  switch (column.format) {
    case "share":
      return <span className="font-medium">{shareOf(column, row, rows)}</span>;
    case "boolean":
      return value ? (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200">
          Yes
        </span>
      ) : (
        <span className="text-xs text-zinc-400">No</span>
      );
    case "status": {
      const status = String(value ?? "");
      return (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? ""}`}
        >
          {status || "—"}
        </span>
      );
    }
    case "datetime":
      return value ? (
        <span className="whitespace-nowrap">
          {new Date(String(value)).toLocaleString()}
        </span>
      ) : (
        empty
      );
    case "lookup": {
      if (value === null || value === undefined) return empty;
      return <>{column.lookup?.[String(value)] ?? `#${String(value)}`}</>;
    }
    case "mono":
      return value === null || value === undefined ? (
        empty
      ) : (
        <span className="font-mono text-xs">{String(value)}</span>
      );
    case "truncate":
      return value ? (
        <span className="block max-w-xs truncate" title={String(value)}>
          {String(value)}
        </span>
      ) : (
        empty
      );
    case "details":
      return value ? (
        <details className="max-w-md">
          <summary className="cursor-pointer truncate text-zinc-700 dark:text-zinc-300">
            {String(value).split("\n")[0]}
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-2 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {String(value)}
          </pre>
        </details>
      ) : (
        empty
      );
    default:
      return value === null || value === undefined || value === ""
        ? empty
        : <>{String(value)}</>;
  }
}
