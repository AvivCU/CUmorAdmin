"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Generation } from "@/lib/types";

type FormState = {
  mode: "create" | "edit";
  id: number | null;
  prompt: string;
  caption: string;
  authorName: string;
};

const EMPTY_FORM: FormState = {
  mode: "create",
  id: null,
  prompt: "",
  caption: "",
  authorName: "",
};

export default function MediaManager({
  initialItems,
  currentUserId,
}: {
  initialItems: Generation[];
  currentUserId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openCreate = () => {
    setErrorMessage("");
    setForm({ ...EMPTY_FORM, mode: "create" });
  };

  const openEdit = (item: Generation) => {
    setErrorMessage("");
    setForm({
      mode: "edit",
      id: item.id,
      prompt: item.prompt,
      caption: item.caption,
      authorName: item.author_name,
    });
  };

  const closeForm = () => setForm(null);

  const handleSave = async () => {
    if (!form) return;
    if (!form.caption.trim()) {
      setErrorMessage("Caption is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    const supabase = createClient();

    if (form.mode === "create") {
      const { data, error } = await supabase
        .from("generations")
        .insert({
          creator_id: currentUserId,
          author_name: form.authorName.trim() || "Admin",
          prompt: form.prompt.trim(),
          caption: form.caption.trim(),
        })
        .select()
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsSaving(false);
        return;
      }

      setItems((current) => [data as Generation, ...current]);
    } else if (form.id !== null) {
      const { data, error } = await supabase
        .from("generations")
        .update({
          author_name: form.authorName.trim() || "Admin",
          prompt: form.prompt.trim(),
          caption: form.caption.trim(),
        })
        .eq("id", form.id)
        .select()
        .single();

      if (error) {
        setErrorMessage(error.message);
        setIsSaving(false);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === form.id ? (data as Generation) : item
        )
      );
    }

    setIsSaving(false);
    setForm(null);
  };

  const handleDelete = async (item: Generation) => {
    if (
      !window.confirm(
        `Delete this caption? "${item.caption}"\n\nThis also deletes its votes and can't be undone.`
      )
    ) {
      return;
    }

    const supabase = createClient();
    const previousItems = items;
    setItems((current) => current.filter((i) => i.id !== item.id));

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", item.id);

    if (error) {
      setItems(previousItems);
      window.alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Captions
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {items.length} AI-generated caption{items.length === 1 ? "" : "s"}
            . Admin can create / read / update / delete.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New caption
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Caption</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Votes</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-zinc-400" colSpan={5}>
                  No captions yet.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="max-w-sm px-4 py-3">
                  <p className="truncate text-zinc-900 dark:text-zinc-50">
                    &ldquo;{item.caption}&rdquo;
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    prompt: {item.prompt}
                  </p>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {item.author_name}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  +{item.upvotes} / -{item.downvotes}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-xs font-medium text-zinc-900 underline dark:text-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-xs font-medium text-red-600 underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-950"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {form.mode === "create" ? "New caption" : "Edit caption"}
            </h2>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                Caption
                <textarea
                  className="min-h-20 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.caption}
                  onChange={(event) =>
                    setForm({ ...form, caption: event.target.value })
                  }
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Prompt
                <input
                  className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.prompt}
                  onChange={(event) =>
                    setForm({ ...form, prompt: event.target.value })
                  }
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Author name
                <input
                  className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.authorName}
                  onChange={(event) =>
                    setForm({ ...form, authorName: event.target.value })
                  }
                  placeholder="Admin"
                />
              </label>
            </div>

            {errorMessage && (
              <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
