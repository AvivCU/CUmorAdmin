import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, term, definition, example, created_at";

export default async function TermsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("terms").select(SELECT).order("term");

  if (error) return <LoadError title="Terms" message={error.message} />;

  return (
    <ResourceManager
      title="Terms"
      description="Campus vocabulary injected into prompts via {{terms}}."
      table="terms"
      selectColumns={SELECT}
      itemLabel="term"
      initialRows={(data ?? []) as Row[]}
      columns={[
        { key: "term", label: "Term" },
        { key: "definition", label: "Definition", format: "truncate" },
        { key: "example", label: "Example", format: "truncate" },
        { key: "created_at", label: "Added", format: "datetime" },
      ]}
      fields={[
        { name: "term", label: "Term", type: "text", required: true, placeholder: "Butler" },
        { name: "definition", label: "Definition", type: "textarea", required: true },
        { name: "example", label: "Example usage", type: "text" },
      ]}
    />
  );
}
