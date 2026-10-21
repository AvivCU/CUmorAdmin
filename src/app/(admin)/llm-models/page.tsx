import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, provider_id, name, model_identifier, temperature, is_active, created_at";

export default async function LlmModelsPage() {
  const supabase = await createClient();
  const [models, providers] = await Promise.all([
    supabase.from("llm_models").select(SELECT).order("name"),
    supabase.from("llm_providers").select("id, name").order("name"),
  ]);

  const error = models.error ?? providers.error;
  if (error) return <LoadError title="LLM models" message={error.message} />;

  const providerOptions = (providers.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.name,
  }));
  const providerNames = Object.fromEntries(
    providerOptions.map((option) => [option.value, option.label])
  );

  return (
    <ResourceManager
      title="LLM models"
      description="Models that prompt chain steps can call."
      table="llm_models"
      selectColumns={SELECT}
      itemLabel="model"
      initialRows={(models.data ?? []) as Row[]}
      columns={[
        { key: "name", label: "Name" },
        { key: "provider_id", label: "Provider", format: "lookup", lookup: providerNames },
        { key: "model_identifier", label: "API identifier", format: "mono" },
        { key: "temperature", label: "Temp." },
        { key: "is_active", label: "Active", format: "boolean" },
      ]}
      fields={[
        { name: "name", label: "Display name", type: "text", required: true, placeholder: "Gemini 3.8 Flash" },
        {
          name: "provider_id",
          label: "Provider",
          type: "select",
          required: true,
          numeric: true,
          options: providerOptions,
        },
        {
          name: "model_identifier",
          label: "API identifier",
          type: "text",
          required: true,
          placeholder: "gemini-3.8-flash",
          help: "Exactly as the provider's API expects it.",
        },
        {
          name: "temperature",
          label: "Temperature",
          type: "number",
          required: true,
          step: "0.1",
          min: 0,
          max: 2,
          defaultValue: "1",
        },
        { name: "is_active", label: "Active", type: "boolean", defaultValue: true },
      ]}
    />
  );
}
