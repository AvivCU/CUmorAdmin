"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/data-table";

export type ImageItem = {
  path: string;
  owner: string;
  size: number | null;
  updatedAt: string;
  url: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number | null) {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validate(file: File) {
  if (!file.type.startsWith("image/")) return "Please choose an image file.";
  if (file.size > MAX_BYTES) return "Images must be 5 MB or smaller.";
  return null;
}

export default function ImagesManager({
  bucket,
  initialItems,
}: {
  bucket: string;
  initialItems: ImageItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const uploadInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<ImageItem | null>(null);

  const publicUrl = (path: string) => {
    const { data } = createClient().storage.from(bucket).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleUpload = async (file: File) => {
    const problem = validate(file);
    if (problem) return setErrorMessage(problem);

    setErrorMessage("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `admin/${Date.now()}-${safeName}`;
    setBusyPath("__upload__");

    const { error } = await createClient()
      .storage.from(bucket)
      .upload(path, file, { contentType: file.type });

    setBusyPath(null);
    if (error) return setErrorMessage(`Upload failed: ${error.message}`);

    setItems((current) => [
      {
        path,
        owner: "Admin upload",
        size: file.size,
        updatedAt: new Date().toISOString(),
        url: publicUrl(path),
      },
      ...current,
    ]);
  };

  const handleReplace = async (item: ImageItem, file: File) => {
    const problem = validate(file);
    if (problem) return setErrorMessage(problem);

    setErrorMessage("");
    setBusyPath(item.path);

    const { error } = await createClient()
      .storage.from(bucket)
      .upload(item.path, file, { upsert: true, contentType: file.type });

    setBusyPath(null);
    if (error) return setErrorMessage(`Replace failed: ${error.message}`);

    setItems((current) =>
      current.map((i) =>
        i.path === item.path
          ? { ...i, size: file.size, updatedAt: new Date().toISOString(), url: publicUrl(i.path) }
          : i
      )
    );
  };

  const handleDelete = async (item: ImageItem) => {
    const warning =
      item.owner === "Admin upload"
        ? ""
        : `\n\nThis is ${item.owner}'s profile photo; it will disappear from their profile.`;
    if (!window.confirm(`Delete ${item.path}?${warning}`)) return;

    setErrorMessage("");
    setBusyPath(item.path);

    const { data, error } = await createClient().storage.from(bucket).remove([item.path]);

    setBusyPath(null);
    if (error || !data?.length) {
      return setErrorMessage(
        `Delete failed: ${error?.message ?? "you don't have permission to delete this image."}`
      );
    }
    setItems((current) => current.filter((i) => i.path !== item.path));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Images"
        description={`${items.length} image${items.length === 1 ? "" : "s"} in the "${bucket}" storage bucket, including users' profile photos. Admin can create / read / update / delete.`}
        action={
          <button
            onClick={() => uploadInput.current?.click()}
            disabled={busyPath !== null}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {busyPath === "__upload__" ? "Uploading..." : "+ Upload image"}
          </button>
        }
      />

      <input
        ref={uploadInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) handleUpload(file);
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && replaceTarget.current) handleReplace(replaceTarget.current, file);
        }}
      />

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">No images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.path}
              className={`overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${
                busyPath === item.path ? "opacity-50" : ""
              }`}
            >
              <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={item.url}
                  alt={item.path}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {item.owner}
                </p>
                <p className="truncate font-mono text-xs text-zinc-400" title={item.path}>
                  {item.path}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatSize(item.size)} · {new Date(item.updatedAt).toLocaleDateString()}
                </p>
                <div className="mt-1 flex gap-3">
                  <button
                    onClick={() => {
                      replaceTarget.current = item;
                      replaceInput.current?.click();
                    }}
                    disabled={busyPath !== null}
                    className="text-xs font-medium text-zinc-900 underline disabled:opacity-50 dark:text-zinc-50"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={busyPath !== null}
                    className="text-xs font-medium text-red-600 underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
