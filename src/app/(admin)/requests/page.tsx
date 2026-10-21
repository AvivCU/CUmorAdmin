import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DataTable, { LoadError, PageHeader } from "@/components/data-table";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const supabase = await createClient();
  const [requests, chains, profiles] = await Promise.all([
    supabase
      .from("generation_requests")
      .select("id, user_id, chain_id, prompt, status, error, generation_id, created_at, completed_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("prompt_chains").select("id, name"),
    supabase.from("profiles").select("id, first_name, last_name"),
  ]);

  const error = requests.error ?? chains.error ?? profiles.error;
  if (error) return <LoadError title="Generation requests" message={error.message} />;

  const chainNames = Object.fromEntries(
    (chains.data ?? []).map((chain) => [String(chain.id), chain.name])
  );
  const userNames = Object.fromEntries(
    (profiles.data ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed user",
    ])
  );

  const rows = (requests.data ?? []).map((request) => ({
    ...request,
    duration: request.completed_at
      ? `${((new Date(request.completed_at).getTime() - new Date(request.created_at).getTime()) / 1000).toFixed(1)}s`
      : null,
  })) as Row[];

  const completed = rows.filter((row) => row.status === "completed").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Generation requests"
        description={`${rows.length} most recent caption requests, ${completed} completed. Each automatic retry is logged as its own request. Read-only.`}
      />

      <DataTable
        rows={rows}
        emptyMessage="No requests yet. Generate a caption in CUmor to see one here."
        columns={[
          { key: "id", label: "#", format: "mono" },
          { key: "prompt", label: "Prompt", format: "truncate" },
          { key: "user_id", label: "User", format: "lookup", lookup: userNames },
          { key: "chain_id", label: "Chain", format: "lookup", lookup: chainNames },
          { key: "status", label: "Status", format: "status" },
          { key: "error", label: "Error", format: "truncate" },
          { key: "duration", label: "Took" },
          { key: "created_at", label: "Requested", format: "datetime" },
        ]}
        renderActions={(row) => (
          <Link
            href={`/llm-responses?request=${row.id}`}
            className="whitespace-nowrap text-xs font-medium text-zinc-900 underline dark:text-zinc-50"
          >
            LLM calls →
          </Link>
        )}
      />
    </div>
  );
}
