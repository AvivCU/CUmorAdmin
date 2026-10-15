import { createClient } from "@/lib/supabase/server";
import type { Generation } from "@/lib/types";
import StatTile from "@/components/stat-tile";
import BarChart from "@/components/bar-chart";
import DivergingBar from "@/components/diverging-bar";

export const dynamic = "force-dynamic";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: userCount }, { data: generations }, { count: voteCount }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("generations")
        .select(
          "id, creator_id, author_name, prompt, caption, upvotes, downvotes, created_at"
        ),
      supabase.from("votes").select("id", { count: "exact", head: true }),
    ]);

  const items = (generations ?? []) as Generation[];

  const totalUpvotes = items.reduce((sum, item) => sum + item.upvotes, 0);
  const totalDownvotes = items.reduce((sum, item) => sum + item.downvotes, 0);
  const totalVoteWeight = totalUpvotes + totalDownvotes;
  const approvalRate =
    totalVoteWeight > 0
      ? Math.round((totalUpvotes / totalVoteWeight) * 100)
      : null;

  const byScore = [...items].sort(
    (a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
  );
  const topCaption = byScore[0];
  const bottomCaption = byScore[byScore.length - 1];

  const creatorCounts = new Map<string, { name: string; count: number }>();
  for (const item of items) {
    const existing = creatorCounts.get(item.creator_id);
    if (existing) {
      existing.count += 1;
    } else {
      creatorCounts.set(item.creator_id, {
        name: item.author_name,
        count: 1,
      });
    }
  }
  const mostActive = [...creatorCounts.values()].sort(
    (a, b) => b.count - a.count
  )[0];

  const days = lastNDays(14);
  const countsByDay = new Map<string, number>(days.map((d) => [d, 0]));
  for (const item of items) {
    const day = item.created_at.slice(0, 10);
    if (countsByDay.has(day)) {
      countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
    }
  }
  const chartData = days.map((day) => ({
    label: new Date(day + "T00:00:00").toLocaleDateString(undefined, {
      month: "numeric",
      day: "numeric",
    }),
    value: countsByDay.get(day) ?? 0,
  }));

  const leaderboard = [...items]
    .sort((a, b) => b.upvotes + b.downvotes - (a.upvotes + a.downvotes))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Live stats across all users, captions, and votes.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Users" value={userCount ?? 0} />
        <StatTile label="Captions" value={items.length} />
        <StatTile label="Votes cast" value={voteCount ?? 0} />
        <StatTile
          label="Approval rate"
          value={approvalRate === null ? "--" : `${approvalRate}%`}
        />
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Captions generated, last 14 days
        </h2>
        <div className="mt-4">
          <BarChart data={chartData} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Top caption
          </p>
          {topCaption ? (
            <>
              <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-50">
                &ldquo;{topCaption.caption}&rdquo;
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                +{topCaption.upvotes} / -{topCaption.downvotes} &middot;{" "}
                {topCaption.author_name}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">No captions yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Most disliked
          </p>
          {bottomCaption ? (
            <>
              <p className="mt-2 text-sm text-zinc-900 dark:text-zinc-50">
                &ldquo;{bottomCaption.caption}&rdquo;
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                +{bottomCaption.upvotes} / -{bottomCaption.downvotes} &middot;{" "}
                {bottomCaption.author_name}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">No captions yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Most active creator
          </p>
          {mostActive ? (
            <>
              <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {mostActive.name}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {mostActive.count} caption{mostActive.count === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">No captions yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Most-voted captions
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {leaderboard.length === 0 && (
            <li className="text-sm text-zinc-400">No votes yet.</li>
          )}
          {leaderboard.map((item) => (
            <li key={item.id}>
              <p className="truncate text-sm text-zinc-900 dark:text-zinc-50">
                &ldquo;{item.caption}&rdquo;
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="flex-1">
                  <DivergingBar
                    upvotes={item.upvotes}
                    downvotes={item.downvotes}
                  />
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  +{item.upvotes} / -{item.downvotes}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
