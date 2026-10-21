import { createClient } from "@/lib/supabase/server";
import { LoadError } from "@/components/data-table";
import ImagesManager, { type ImageItem } from "./images-manager";

export const dynamic = "force-dynamic";

const BUCKET = "avatars";
const PLACEHOLDER = ".emptyFolderPlaceholder";

export default async function ImagesPage() {
  const supabase = await createClient();
  const storage = supabase.storage.from(BUCKET);

  const [root, profiles] = await Promise.all([
    storage.list("", { limit: 1000 }),
    supabase.from("profiles").select("id, first_name, last_name"),
  ]);

  if (root.error) return <LoadError title="Images" message={root.error.message} />;

  const entries = root.data ?? [];
  const folders = entries.filter((entry) => entry.id === null).map((entry) => entry.name);
  const folderListings = await Promise.all(
    folders.map(async (folder) => ({
      folder,
      result: await storage.list(folder, { limit: 1000 }),
    }))
  );

  const listingError = folderListings.find((listing) => listing.result.error);
  if (listingError?.result.error) {
    return <LoadError title="Images" message={listingError.result.error.message} />;
  }

  const files = [
    ...entries.filter((entry) => entry.id !== null).map((file) => ({ folder: "", file })),
    ...folderListings.flatMap(({ folder, result }) =>
      (result.data ?? [])
        .filter((file) => file.id !== null)
        .map((file) => ({ folder, file }))
    ),
  ].filter(({ file }) => file.name !== PLACEHOLDER);

  const ownerNames = new Map(
    (profiles.data ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed user",
    ])
  );

  const items: ImageItem[] = files
    .map(({ folder, file }) => {
      const path = folder ? `${folder}/${file.name}` : file.name;
      const updatedAt = file.updated_at ?? file.created_at ?? new Date().toISOString();
      return {
        path,
        owner:
          folder === "admin"
            ? "Admin upload"
            : ownerNames.get(folder) ?? (folder ? "Unknown user" : "—"),
        size: (file.metadata?.size as number | undefined) ?? null,
        updatedAt,
        url: `${storage.getPublicUrl(path).data.publicUrl}?t=${new Date(updatedAt).getTime()}`,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return <ImagesManager bucket={BUCKET} initialItems={items} />;
}
