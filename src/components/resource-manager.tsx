"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Column, Row } from "./cell";
import DataTable, { PageHeader } from "./data-table";

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select";
  required?: boolean;
  placeholder?: string;
  help?: string;
  step?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  // Send select values as numbers (for bigint foreign keys).
  numeric?: boolean;
  defaultValue?: string | boolean;
};

type FormValues = Record<string, string | boolean>;

type FormState = { mode: "create" | "edit"; id: Row["id"] | null; values: FormValues };

function blankValues(fields: Field[]): FormValues {
  return Object.fromEntries(
    fields.map((field) => [
      field.name,
      field.defaultValue ?? (field.type === "boolean" ? false : ""),
    ])
  );
}

function valuesFromRow(fields: Field[], row: Row): FormValues {
  return Object.fromEntries(
    fields.map((field) => {
      const value = row[field.name];
      if (field.type === "boolean") return [field.name, value === true];
      return [field.name, value === null || value === undefined ? "" : String(value)];
    })
  );
}

function toPayload(fields: Field[], values: FormValues) {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.type === "boolean") {
      payload[field.name] = value === true;
      continue;
    }
    const text = String(value).trim();
    if (text === "") {
      payload[field.name] = null;
    } else if (field.type === "number" || field.numeric) {
      payload[field.name] = Number(text);
    } else {
      payload[field.name] = text;
    }
  }
  return payload;
}

function friendlyError(error: { code?: string; message: string }, itemLabel: string) {
  if (error.code === "23505") return `That ${itemLabel} already exists.`;
  if (error.code === "23503") {
    return `This ${itemLabel} is still referenced by other records, so it can't be removed.`;
  }
  if (error.code === "PGRST116") {
    return `You don't have permission to change this ${itemLabel}, or it no longer exists.`;
  }
  return error.message;
}

const inputClass =
  "rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function ResourceManager({
  title,
  description,
  table,
  selectColumns,
  itemLabel,
  initialRows,
  columns,
  fields,
  canCreate = true,
  canDelete = true,
}: {
  title: string;
  description: string;
  table: string;
  selectColumns: string;
  itemLabel: string;
  initialRows: Row[];
  columns: Column[];
  fields: Field[];
  canCreate?: boolean;
  canDelete?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const openCreate = () => {
    setErrorMessage("");
    setForm({ mode: "create", id: null, values: blankValues(fields) });
  };

  const openEdit = (row: Row) => {
    setErrorMessage("");
    setForm({ mode: "edit", id: row.id, values: valuesFromRow(fields, row) });
  };

  const setValue = (name: string, value: string | boolean) => {
    setForm((current) =>
      current ? { ...current, values: { ...current.values, [name]: value } } : current
    );
  };

  const handleSave = async () => {
    if (!form) return;

    const missing = fields.find(
      (field) =>
        field.required &&
        field.type !== "boolean" &&
        String(form.values[field.name]).trim() === ""
    );
    if (missing) {
      setErrorMessage(`${missing.label} is required.`);
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    const supabase = createClient();
    const payload = toPayload(fields, form.values);

    const { data, error } =
      form.mode === "create"
        ? await supabase.from(table).insert(payload).select(selectColumns).single()
        : await supabase
            .from(table)
            .update(payload)
            .eq("id", form.id!)
            .select(selectColumns)
            .single();

    setIsSaving(false);

    if (error) {
      setErrorMessage(friendlyError(error, itemLabel));
      return;
    }

    const saved = data as unknown as Row;
    setRows((current) =>
      form.mode === "create"
        ? [saved, ...current]
        : current.map((row) => (row.id === saved.id ? saved : row))
    );
    setForm(null);
  };

  const handleDelete = async (row: Row) => {
    const label = String(row[columns[0].key] ?? `#${row.id}`);
    if (!window.confirm(`Delete ${itemLabel} "${label}"? This can't be undone.`)) {
      return;
    }

    const previousRows = rows;
    setRows((current) => current.filter((r) => r.id !== row.id));

    const supabase = createClient();
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq("id", row.id)
      .select("id");

    if (error || !data?.length) {
      setRows(previousRows);
      window.alert(
        `Delete failed: ${
          error ? friendlyError(error, itemLabel) : "you don't have permission to delete this."
        }`
      );
    }
  };

  const capabilities = [
    canCreate && "create",
    "read",
    "update",
    canDelete && "delete",
  ]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={title}
        description={`${description} ${rows.length} total. Admin can ${capabilities}.`}
        action={
          canCreate && (
            <button
              onClick={openCreate}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + New {itemLabel}
            </button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        emptyMessage={`No ${itemLabel}s yet.`}
        renderActions={(row) => (
          <div className="flex gap-3">
            <button
              onClick={() => openEdit(row)}
              className="text-xs font-medium text-zinc-900 underline dark:text-zinc-50"
            >
              Edit
            </button>
            {canDelete && (
              <button
                onClick={() => handleDelete(row)}
                className="text-xs font-medium text-red-600 underline"
              >
                Delete
              </button>
            )}
          </div>
        )}
      />

      {form && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setForm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resource-form-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-zinc-950"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="resource-form-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {form.mode === "create" ? `New ${itemLabel}` : `Edit ${itemLabel}`}
            </h2>

            <div className="mt-4 flex flex-col gap-3">
              {fields.map((field) => {
                const value = form.values[field.name];

                if (field.type === "boolean") {
                  return (
                    <label key={field.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(event) => setValue(field.name, event.target.checked)}
                      />
                      {field.label}
                    </label>
                  );
                }

                return (
                  <label key={field.name} className="flex flex-col gap-1 text-sm">
                    <span>
                      {field.label}
                      {field.required && <span className="text-red-600"> *</span>}
                    </span>
                    {field.type === "textarea" ? (
                      <textarea
                        className={`${inputClass} min-h-24`}
                        value={String(value)}
                        placeholder={field.placeholder}
                        onChange={(event) => setValue(field.name, event.target.value)}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className={inputClass}
                        value={String(value)}
                        onChange={(event) => setValue(field.name, event.target.value)}
                      >
                        <option value="">Choose…</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={inputClass}
                        type={field.type === "number" ? "number" : "text"}
                        step={field.step}
                        min={field.min}
                        max={field.max}
                        value={String(value)}
                        placeholder={field.placeholder}
                        onChange={(event) => setValue(field.name, event.target.value)}
                      />
                    )}
                    {field.help && (
                      <span className="text-xs text-zinc-400">{field.help}</span>
                    )}
                  </label>
                );
              })}
            </div>

            {errorMessage && <p className="mt-3 text-sm text-red-600">{errorMessage}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setForm(null)}
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
