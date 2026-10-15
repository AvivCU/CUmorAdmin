import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin-nav";
import SignOutButton from "@/components/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_superadmin) {
    redirect("/unauthorized");
  }

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    user.email;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-zinc-200 p-4 md:w-56 md:shrink-0 md:border-b-0 md:border-r md:p-6 dark:border-zinc-800">
        <div className="flex items-center gap-2 px-1">
          <span className="text-xl" aria-hidden="true">
            🛠️
          </span>
          <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            CUmor Admin
          </span>
        </div>
        <AdminNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 md:px-8 dark:border-zinc-800">
          <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as {displayName}
          </span>
          <SignOutButton />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
