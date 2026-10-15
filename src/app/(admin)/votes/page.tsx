import { createClient } from "@/lib/supabase/server";
import type { Vote, Generation, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function VotesPage() {
  const supabase = await createClient();

  const [{ data: votes, error }, { data: generations }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("votes")
        .select("id, generation_id, user_id, value, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("generations").select("id, caption"),
      supabase.from("profiles").select("id, first_name, last_name"),
    ]);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Votes
        </h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  const captionById = new Map(
    (generations ?? []).map((g: Pick<Generation, "id" | "caption">) => [
      g.id,
      g.caption,
    ])
  );
  const nameById = new Map(
    (profiles ?? []).map((p: Pick<Profile, "id" | "first_name" | "last_name">) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed user",
    ])
  );

  const items = (votes ?? []) as Vote[];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Votes
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Most recent {items.length} vote{items.length === 1 ? "" : "s"}.
          Read-only.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Vote</th>
              <th className="px-4 py-3 font-medium">Caption</th>
              <th className="px-4 py-3 font-medium">Voter</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-zinc-400" colSpan={4}>
                  No votes yet.
                </td>
              </tr>
            )}
            {items.map((vote) => (
              <tr
                key={vote.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="px-4 py-3">
                  {vote.value === 1 ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                      ▲ Upvote
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
                      ▼ Downvote
                    </span>
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-zinc-900 dark:text-zinc-50">
                  {captionById.get(vote.generation_id) ?? (
                    <span className="text-zinc-400">(deleted)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {nameById.get(vote.user_id) ?? "Unknown"}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {new Date(vote.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
