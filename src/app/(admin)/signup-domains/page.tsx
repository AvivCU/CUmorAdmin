import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, domain, created_at";

export default async function SignupDomainsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("allowed_signup_domains")
    .select(SELECT)
    .order("domain");

  if (error) return <LoadError title="Allowed signup domains" message={error.message} />;

  return (
    <ResourceManager
      title="Allowed signup domains"
      description="Email domains approved for sign-up."
      table="allowed_signup_domains"
      selectColumns={SELECT}
      itemLabel="domain"
      initialRows={(data ?? []) as Row[]}
      columns={[
        { key: "domain", label: "Domain", format: "mono" },
        { key: "created_at", label: "Added", format: "datetime" },
      ]}
      fields={[
        {
          name: "domain",
          label: "Domain",
          type: "text",
          required: true,
          placeholder: "columbia.edu",
          help: "Just the part after the @.",
        },
      ]}
    />
  );
}
