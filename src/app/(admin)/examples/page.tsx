import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, prompt, caption, is_active, created_at";

export default async function ExamplesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generation_examples")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error) return <LoadError title="Generation examples" message={error.message} />;

  return (
    <ResourceManager
      title="Generation examples"
      description="Few-shot examples injected into prompts via {{examples}} (the 5 newest active ones)."
      table="generation_examples"
      selectColumns={SELECT}
      itemLabel="example"
      initialRows={(data ?? []) as Row[]}
      columns={[
        { key: "caption", label: "Caption", format: "truncate" },
        { key: "prompt", label: "Prompt", format: "truncate" },
        { key: "is_active", label: "Active", format: "boolean" },
        { key: "created_at", label: "Added", format: "datetime" },
      ]}
      fields={[
        { name: "prompt", label: "Prompt", type: "text", required: true },
        { name: "caption", label: "Caption", type: "textarea", required: true },
        { name: "is_active", label: "Use in prompts", type: "boolean", defaultValue: true },
      ]}
    />
  );
}
