import { Cell, type Column, type Row } from "./cell";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function LoadError({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-4 text-sm text-red-600">{message}</p>
    </div>
  );
}

export default function DataTable({
  columns,
  rows,
  emptyMessage,
  renderActions,
}: {
  columns: Column[];
  rows: Row[];
  emptyMessage: string;
  renderActions?: (row: Row) => React.ReactNode;
}) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key + column.label} className="px-4 py-3 font-medium">
                {column.label}
              </th>
            ))}
            {renderActions && <th className="px-4 py-3 font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-zinc-400" colSpan={colSpan}>
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 align-top last:border-0 dark:border-zinc-900"
            >
              {columns.map((column) => (
                <td
                  key={column.key + column.label}
                  className="px-4 py-3 text-zinc-700 dark:text-zinc-300"
                >
                  <Cell column={column} row={row} rows={rows} />
                </td>
              ))}
              {renderActions && <td className="px-4 py-3">{renderActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
