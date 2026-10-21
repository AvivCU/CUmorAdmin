import { createClient } from "@/lib/supabase/server";
import type { Generation } from "@/lib/types";
import MediaManager from "./media-manager";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const supabase = await createClient();

  const [{ data: generations, error }, { data: userData }] =
    await Promise.all([
      supabase
        .from("generations")
        .select(
          "id, creator_id, author_name, prompt, caption, upvotes, downvotes, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Captions
        </h1>
        <p className="mt-4 text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <MediaManager
      initialItems={(generations ?? []) as Generation[]}
      currentUserId={userData.user!.id}
    />
  );
}
