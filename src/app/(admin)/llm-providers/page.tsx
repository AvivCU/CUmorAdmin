import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, name, created_at";

export default async function LlmProvidersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("llm_providers").select(SELECT).order("name");

  if (error) return <LoadError title="LLM providers" message={error.message} />;

  return (
    <ResourceManager
      title="LLM providers"
      description='Companies whose models can run chain steps. Only "Google" has a live integration today.'
      table="llm_providers"
      selectColumns={SELECT}
      itemLabel="provider"
      initialRows={(data ?? []) as Row[]}
      columns={[
        { key: "name", label: "Name" },
        { key: "id", label: "ID", format: "mono" },
        { key: "created_at", label: "Added", format: "datetime" },
      ]}
      fields={[{ name: "name", label: "Name", type: "text", required: true, placeholder: "Google" }]}
    />
  );
}
