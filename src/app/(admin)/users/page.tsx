import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

function initials(firstName: string | null, lastName: string | null) {
  const value = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part![0])
    .join("")
    .toUpperCase();
  return value || "?";
}

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url, is_superadmin, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Users
        </h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  const items = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Users
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {items.length} registered profile{items.length === 1 ? "" : "s"}.
          Read-only.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3 font-medium">User ID</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-zinc-400" colSpan={4}>
                  No users yet.
                </td>
              </tr>
            )}
            {items.map((profile) => {
              const name =
                [profile.first_name, profile.last_name]
                  .filter(Boolean)
                  .join(" ") || "Unnamed user";
              return (
                <tr
                  key={profile.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt={name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {initials(profile.first_name, profile.last_name)}
                        </span>
                      )}
                      <span className="text-zinc-900 dark:text-zinc-50">
                        {name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {profile.is_superadmin ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Superadmin
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">User</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(profile.updated_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                    {profile.id}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
