import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoadError, PageHeader } from "@/components/data-table";

export const dynamic = "force-dynamic";

type Step = {
  id: number;
  chain_id: number;
  step_order: number;
  prompt_template: string;
  llm_models: { name: string; llm_providers: { name: string } | null } | null;
};

export default async function PromptChainsPage() {
  const supabase = await createClient();
  const [chains, steps, mix] = await Promise.all([
    supabase.from("prompt_chains").select("id, name, description, created_at").order("id"),
    supabase
      .from("prompt_chain_steps")
      .select("id, chain_id, step_order, prompt_template, llm_models(name, llm_providers(name))")
      .order("step_order"),
    supabase.from("prompt_chain_mix").select("chain_id, weight, is_active"),
  ]);

  const error = chains.error ?? steps.error ?? mix.error;
  if (error) return <LoadError title="Prompt chains" message={error.message} />;

  const stepRows = (steps.data ?? []) as unknown as Step[];
  const mixRows = mix.data ?? [];
  const totalActiveWeight = mixRows
    .filter((m) => m.is_active)
    .reduce((sum, m) => sum + Number(m.weight), 0);

  const chainList = chains.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Prompt chains"
        description={`${chainList.length} chain${chainList.length === 1 ? "" : "s"} and their steps, run in order for each caption request. Read-only; adjust traffic in Chain mix.`}
        action={
          <Link
            href="/chain-mix"
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Edit mix →
          </Link>
        }
      />

      {chainList.length === 0 && <p className="text-sm text-zinc-400">No prompt chains yet.</p>}

      {chainList.map((chain) => {
        const chainSteps = stepRows.filter((step) => step.chain_id === chain.id);
        const mixEntry = mixRows.find((m) => m.chain_id === chain.id);
        const share =
          mixEntry?.is_active && totalActiveWeight > 0
            ? Math.round((Number(mixEntry.weight) / totalActiveWeight) * 100)
            : 0;

        return (
          <section
            key={chain.id}
            className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {chain.name}
                </h2>
                {chain.description && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {chain.description}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {share}% of traffic
              </span>
            </div>

            <ol className="mt-4 flex flex-col gap-3">
              {chainSteps.length === 0 && (
                <li className="text-sm text-zinc-400">This chain has no steps.</li>
              )}
              {chainSteps.map((step) => (
                <li key={step.id} className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Step {step.step_order} · {step.llm_models?.name ?? "Unknown model"}
                    {step.llm_models?.llm_providers &&
                      ` (${step.llm_models.llm_providers.name})`}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {step.prompt_template}
                  </pre>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
