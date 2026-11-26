"use client";

import { useEffect, useMemo, useState } from "react";
import {
  adminModelDefinitions,
  type AdminField,
  type AdminModelDefinition,
  type AdminModelKey,
} from "@/lib/admin-models";

type ModelSummary = AdminModelDefinition & { count: number };
type AdminRecord = Record<string, unknown> & { id: string };
type RecordPage = {
  rows: AdminRecord[];
  total: number;
  page: number;
  pageSize: number;
};
type EditorState = { mode: "create" } | { mode: "edit"; record: AdminRecord };

const pageSize = 25;

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    const issues =
      "issues" in payload && Array.isArray(payload.issues)
        ? payload.issues
            .map(issue =>
              typeof issue === "object" &&
              issue !== null &&
              "field" in issue &&
              "message" in issue
                ? `${String(issue.field)}: ${String(issue.message)}`
                : null,
            )
            .filter(Boolean)
            .join(" ")
        : "";
    return issues ? `${payload.error} ${issues}` : payload.error;
  }
  return fallback;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function initialValues(
  definition: AdminModelDefinition,
  record?: AdminRecord,
): Record<string, string | boolean> {
  return Object.fromEntries(
    definition.fields.map(field => {
      const current = record?.[field.key];
      if (field.type === "boolean") {
        return [
          field.key,
          typeof current === "boolean"
            ? current
            : field.defaultValue === true,
        ];
      }
      if (field.type === "json") {
        return [
          field.key,
          current === null || current === undefined
            ? field.defaultValue || ""
            : JSON.stringify(current, null, 2),
        ];
      }
      return [
        field.key,
        current === null || current === undefined
          ? String(field.defaultValue ?? "")
          : String(current),
      ];
    }),
  );
}

export function AdminDataManager() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<AdminModelKey>("AdminActivity");
  const [recordPage, setRecordPage] = useState<RecordPage>({
    rows: [],
    total: 0,
    page: 1,
    pageSize,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const definition = useMemo(
    () => adminModelDefinitions.find(model => model.key === selectedModel)!,
    [selectedModel],
  );
  const pageCount = Math.max(1, Math.ceil(recordPage.total / pageSize));

  useEffect(() => {
    const controller = new AbortController();
    async function loadModels() {
      setLoadingModels(true);
      setError("");
      try {
        const response = await fetch("/api/admin/models", {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(getErrorMessage(payload, "Could not load models."));
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("models" in payload) ||
          !Array.isArray(payload.models)
        ) {
          throw new Error("The server returned an invalid model list.");
        }
        setModels(payload.models as ModelSummary[]);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Could not load models.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingModels(false);
      }
    }
    void loadModels();
    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingRows(true);
      setError("");
      try {
        const query = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          search,
        });
        const response = await fetch(
          `/api/admin/models/${selectedModel}?${query}`,
          { signal: controller.signal },
        );
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(getErrorMessage(payload, "Could not load records."));
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("rows" in payload) ||
          !Array.isArray(payload.rows) ||
          !("total" in payload) ||
          typeof payload.total !== "number"
        ) {
          throw new Error("The server returned invalid records.");
        }
        const lastPage = Math.max(1, Math.ceil(payload.total / pageSize));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setRecordPage({
          rows: payload.rows as AdminRecord[],
          total: payload.total,
          page,
          pageSize,
        });
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Could not load records.");
          setRecordPage({ rows: [], total: 0, page, pageSize });
        }
      } finally {
        if (!controller.signal.aborted) setLoadingRows(false);
      }
    }, search ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, refreshKey, search, selectedModel]);

  function chooseModel(model: AdminModelKey) {
    setSelectedModel(model);
    setPage(1);
    setSearch("");
    setEditor(null);
    setNotice("");
  }

  async function deleteRecord(record: AdminRecord) {
    const subject = definition.key === "User"
      ? "This deletes only the database row, not the Clerk identity. Related rows follow the database's cascade rules."
      : "Related records follow the database's foreign-key and cascade rules.";
    if (!window.confirm(`Delete this ${definition.label} record?\n\n${subject}`)) return;

    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/models/${selectedModel}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, "Could not delete record."));
      const warning =
        typeof payload === "object" && payload !== null && "warning" in payload
          ? payload.warning
          : null;
      setNotice(
        typeof warning === "string" && warning
          ? warning
          : "Record deleted.",
      );
      setRefreshKey(value => value + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete record.");
    }
  }

  function onSaved(message: string) {
    setEditor(null);
    setNotice(message);
    setError("");
    setRefreshKey(value => value + 1);
  }

  return (
    <section className="admin-workspace">
      <header className="page-head">
        <span className="eyebrow">Administration</span>
        <h1>Database management</h1>
        <p className="section-lead">
          Browse, search, create, edit, and delete records across all Prisma
          models. Changes are saved directly to PostgreSQL.
        </p>
      </header>

      <div className="admin-warning" role="note">
        Deletes are permanent and may cascade to related records. Admin actions
        are recorded in AdminActivity. User rows do not create or delete Clerk
        identities.
      </div>
      {error && <div className="scan-error" role="alert">{error}</div>}
      {notice && <div className="admin-notice" role="status">{notice}</div>}

      <div className="admin-workspace-layout">
        <aside className="admin-model-nav" aria-label="Database models">
          <h2>All models</h2>
          {loadingModels && <p className="admin-muted">Loading model counts…</p>}
          {models.map(model => (
            <button
              className={`admin-model-link ${selectedModel === model.key ? "is-selected" : ""}`}
              key={model.key}
              onClick={() => chooseModel(model.key)}
              aria-current={selectedModel === model.key ? "page" : undefined}
            >
              <span>{model.label}</span>
              <strong>{model.count}</strong>
            </button>
          ))}
        </aside>

        <section className="admin-record-panel">
          <div className="admin-record-toolbar">
            <div>
              <span className="eyebrow">{recordPage.total} records</span>
              <h2>{definition.label}</h2>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setEditor({ mode: "create" })}
            >
              Add record
            </button>
          </div>
          {definition.help && <p className="admin-model-help">{definition.help}</p>}
          <input
            className="search admin-search"
            aria-label={`Search ${definition.label}`}
            placeholder={`Search ${definition.label} records`}
            maxLength={100}
            value={search}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {editor && (
            <RecordEditor
              key={`${selectedModel}-${editor.mode}-${editor.mode === "edit" ? editor.record.id : "new"}`}
              definition={definition}
              editor={editor}
              modelKey={selectedModel}
              onCancel={() => setEditor(null)}
              onSaved={onSaved}
            />
          )}

          {loadingRows ? (
            <p className="admin-muted" role="status">Loading records…</p>
          ) : recordPage.rows.length === 0 ? (
            <div className="empty panel">No records found.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {definition.columns.map(column => <th key={column}>{column}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recordPage.rows.map(record => (
                    <RecordTableRows
                      key={record.id}
                      record={record}
                      definition={definition}
                      onEdit={() => setEditor({ mode: "edit", record })}
                      onDelete={() => void deleteRecord(record)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-pagination">
            <span>
              Page {page} of {pageCount}
            </span>
            <div>
              <button
                className="btn btn-outline"
                disabled={page <= 1 || loadingRows}
                onClick={() => setPage(current => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-outline"
                disabled={page >= pageCount || loadingRows}
                onClick={() => setPage(current => Math.min(pageCount, current + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function RecordTableRows({
  record,
  definition,
  onEdit,
  onDelete,
}: {
  record: AdminRecord;
  definition: AdminModelDefinition;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const columns = ["id", ...definition.columns];
  return (
    <>
      <tr>
        {columns.map(column => (
          <td key={column} title={displayValue(record[column])}>
            {column === "id" ? <code>{displayValue(record[column])}</code> : displayValue(record[column])}
          </td>
        ))}
        <td className="admin-row-actions">
          <button className="btn btn-outline" onClick={onEdit}>Edit</button>
          <button className="btn btn-danger" onClick={onDelete}>Delete</button>
        </td>
      </tr>
      <tr className="admin-details-row">
        <td colSpan={columns.length + 1}>
          <details>
            <summary>View all fields</summary>
            <pre>{JSON.stringify(record, null, 2)}</pre>
          </details>
        </td>
      </tr>
    </>
  );
}

function RecordEditor({
  definition,
  editor,
  modelKey,
  onCancel,
  onSaved,
}: {
  definition: AdminModelDefinition;
  editor: EditorState;
  modelKey: AdminModelKey;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const record = editor.mode === "edit" ? editor.record : undefined;
  const [values, setValues] = useState(() => initialValues(definition, record));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(key: string, value: string | boolean) {
    setValues(current => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const data: Record<string, unknown> = {};
      for (const field of definition.fields) {
        const value = values[field.key];
        if (field.type === "json") {
          const text = String(value ?? "").trim();
          if (!text) {
            if (field.required) throw new Error(`${field.label} is required.`);
            continue;
          }
          try {
            data[field.key] = JSON.parse(text);
          } catch {
            throw new Error(`${field.label} must contain valid JSON.`);
          }
        } else if (field.type === "boolean") {
          data[field.key] = Boolean(value);
        } else if (field.type === "number") {
          const text = String(value ?? "").trim();
          data[field.key] = text ? Number(text) : "";
        } else {
          data[field.key] = String(value ?? "");
        }
      }

      const response = await fetch(`/api/admin/models/${modelKey}`, {
        method: editor.mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editor.mode === "create" ? data : { id: record?.id, data },
        ),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, "Could not save record."));
      const warning =
        typeof payload === "object" && payload !== null && "warning" in payload
          ? payload.warning
          : null;
      onSaved(
        typeof warning === "string" && warning
          ? warning
          : editor.mode === "create"
            ? "Record created."
            : "Record updated.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-editor" onSubmit={submit}>
      <div className="admin-editor-heading">
        <div>
          <span className="eyebrow">{editor.mode === "create" ? "New record" : "Edit record"}</span>
          <h3>{definition.label}</h3>
          {record && <code>{record.id}</code>}
        </div>
        <button type="button" className="btn btn-outline" onClick={onCancel}>Close</button>
      </div>
      {error && <div className="scan-error" role="alert">{error}</div>}
      <div className="admin-form-grid">
        {definition.fields.map(field => (
          <AdminFieldInput
            key={field.key}
            field={field}
            value={values[field.key] ?? ""}
            onChange={value => updateField(field.key, value)}
          />
        ))}
      </div>
      <div className="admin-editor-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : editor.mode === "create" ? "Create record" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function AdminFieldInput({
  field,
  value,
  onChange,
}: {
  field: AdminField;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="admin-form-field admin-checkbox-field">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={event => onChange(event.target.checked)}
        />
        <span>{field.label}</span>
        {field.help && <small>{field.help}</small>}
      </label>
    );
  }

  return (
    <label className="admin-form-field">
      <span>{field.label}{field.required ? " *" : ""}</span>
      {field.type === "textarea" || field.type === "json" ? (
        <textarea
          required={field.required}
          rows={field.type === "json" ? 7 : 4}
          spellCheck={field.type !== "json"}
          value={String(value)}
          onChange={event => onChange(event.target.value)}
        />
      ) : field.type === "select" ? (
        <select
          required={field.required}
          value={String(value)}
          onChange={event => onChange(event.target.value)}
        >
          <option value="">Select…</option>
          {field.options?.map(option => <option value={option} key={option}>{option}</option>)}
        </select>
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          step={field.type === "number" ? "any" : undefined}
          required={field.required}
          value={String(value)}
          onChange={event => onChange(event.target.value)}
        />
      )}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}
