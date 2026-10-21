import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, chain_id, weight, is_active, updated_at";

export default async function ChainMixPage() {
  const supabase = await createClient();
  const [mix, chains] = await Promise.all([
    supabase.from("prompt_chain_mix").select(SELECT).order("chain_id"),
    supabase.from("prompt_chains").select("id, name"),
  ]);

  const error = mix.error ?? chains.error;
  if (error) return <LoadError title="Prompt chain mix" message={error.message} />;

  const chainNames = Object.fromEntries(
    (chains.data ?? []).map((chain) => [String(chain.id), chain.name])
  );

  return (
    <ResourceManager
      title="Prompt chain mix"
      description="How generation traffic is split between chains: each request picks an active chain with probability weight ÷ total active weight."
      table="prompt_chain_mix"
      selectColumns={SELECT}
      itemLabel="mix entry"
      canCreate={false}
      canDelete={false}
      initialRows={(mix.data ?? []) as Row[]}
      columns={[
        { key: "chain_id", label: "Chain", format: "lookup", lookup: chainNames },
        { key: "weight", label: "Weight" },
        { key: "weight", label: "Traffic share", format: "share", activeKey: "is_active" },
        { key: "is_active", label: "Active", format: "boolean" },
        { key: "updated_at", label: "Updated", format: "datetime" },
      ]}
      fields={[
        { name: "weight", label: "Weight", type: "number", required: true, step: "0.5", min: 0 },
        { name: "is_active", label: "Active", type: "boolean" },
      ]}
    />
  );
}
