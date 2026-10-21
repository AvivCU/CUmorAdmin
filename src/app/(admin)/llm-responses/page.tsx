import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DataTable, { LoadError, PageHeader } from "@/components/data-table";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

export default async function LlmResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  const requestId = request && /^\d+$/.test(request) ? Number(request) : null;

  const supabase = await createClient();
  let query = supabase
    .from("llm_responses")
    .select("id, request_id, step_order, llm_model_id, input_text, output_text, http_status, latency_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (requestId !== null) query = query.eq("request_id", requestId);

  const [responses, models] = await Promise.all([
    query,
    supabase.from("llm_models").select("id, name"),
  ]);

  const error = responses.error ?? models.error;
  if (error) return <LoadError title="LLM responses" message={error.message} />;

  const modelNames = Object.fromEntries(
    (models.data ?? []).map((model) => [String(model.id), model.name])
  );

  const rows = (responses.data ?? []).map((response) => ({
    ...response,
    latency: response.latency_ms === null ? null : `${response.latency_ms} ms`,
  })) as Row[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="LLM responses"
        description={
          requestId !== null
            ? `Every model call made for request #${requestId}, in the order they ran. Read-only.`
            : `${rows.length} most recent raw model calls across all requests. Expand a row to see the full prompt or output. Read-only.`
        }
        action={
          requestId !== null && (
            <Link
              href="/llm-responses"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Show all
            </Link>
          )
        }
      />

      <DataTable
        rows={requestId !== null ? [...rows].reverse() : rows}
        emptyMessage="No LLM calls logged yet."
        columns={[
          { key: "request_id", label: "Request", format: "mono" },
          { key: "step_order", label: "Step" },
          { key: "llm_model_id", label: "Model", format: "lookup", lookup: modelNames },
          { key: "http_status", label: "HTTP", format: "mono" },
          { key: "latency", label: "Latency" },
          { key: "input_text", label: "Prompt sent", format: "details" },
          { key: "output_text", label: "Response", format: "details" },
          { key: "created_at", label: "At", format: "datetime" },
        ]}
      />
    </div>
  );
}
