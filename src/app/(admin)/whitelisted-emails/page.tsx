import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ResourceManager from "@/components/resource-manager";
import type { Row } from "@/components/cell";

export const dynamic = "force-dynamic";

const SELECT = "id, email, created_at";

export default async function WhitelistedEmailsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whitelisted_emails")
    .select(SELECT)
    .order("email");

  if (error) return <LoadError title="Whitelisted emails" message={error.message} />;

  return (
    <ResourceManager
      title="Whitelisted emails"
      description="Individual addresses approved for sign-up regardless of domain."
      table="whitelisted_emails"
      selectColumns={SELECT}
      itemLabel="email"
      initialRows={(data ?? []) as Row[]}
      columns={[
        { key: "email", label: "Email", format: "mono" },
        { key: "created_at", label: "Added", format: "datetime" },
      ]}
      fields={[
        { name: "email", label: "Email", type: "text", required: true, placeholder: "friend@gmail.com" },
      ]}
    />
  );
}
