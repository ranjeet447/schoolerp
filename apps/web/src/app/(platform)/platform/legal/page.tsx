"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";

type LegalDocVersion = {
  id: string;
  doc_key: "terms" | "privacy" | "dpa" | string;
  title: string;
  version: string;
  content_url: string;
  requires_acceptance: boolean;
  is_active: boolean;
  published_at: string;
  created_at: string;
};

type CreatePayload = {
  doc_key: "terms" | "privacy" | "dpa";
  title: string;
  version: string;
  content_url: string;
  requires_acceptance: boolean;
};

const DOC_OPTIONS: Array<{ key: "terms" | "privacy" | "dpa"; label: string }> = [
  { key: "terms", label: "Terms of Service" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "dpa", label: "Data Processing Addendum (DPA)" },
];

const DEFAULT_TITLE_BY_DOC: Record<CreatePayload["doc_key"], string> = {
  terms: "SchoolERP Terms of Service",
  privacy: "SchoolERP Privacy Policy",
  dpa: "SchoolERP Data Processing Addendum",
};

async function readAPIError(response: Response, fallback: string): Promise<string> {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      const message = String(data?.message || data?.error || "").trim();
      if (message) return message;
    } else {
      const text = (await response.text()).trim();
      if (text) return text;
    }
  } catch {
    // ignore parse failures and return fallback below
  }
  return fallback;
}

export default function PlatformLegalDocsPage() {
  const [rows, setRows] = useState<LegalDocVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<string>("");

  const [docKey, setDocKey] = useState<CreatePayload["doc_key"]>("terms");
  const [title, setTitle] = useState(DEFAULT_TITLE_BY_DOC.terms);
  const [version, setVersion] = useState("");
  const [contentURL, setContentURL] = useState("");
  const [requiresAcceptance, setRequiresAcceptance] = useState(true);

  const grouped = useMemo(() => {
    const out: Record<string, LegalDocVersion[]> = {};
    for (const r of rows) {
      const key = r.doc_key || "unknown";
      out[key] = out[key] || [];
      out[key].push(r);
    }
    return out;
  }, [rows]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient("/admin/platform/legal/docs?include_inactive=true&limit=500");
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to load legal docs."));
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setLastLoadedAt(new Date().toISOString());
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Failed to load legal docs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    setTitle(DEFAULT_TITLE_BY_DOC[docKey]);
  }, [docKey]);

  const publish = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const payload: CreatePayload = {
        doc_key: docKey,
        title: title.trim(),
        version: version.trim(),
        content_url: contentURL.trim(),
        requires_acceptance: requiresAcceptance,
      };

      if (!payload.title || !payload.version || !payload.content_url) {
        throw new Error("doc_key, title, version, and content_url are required.");
      }

      const res = await apiClient("/admin/platform/legal/docs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to publish legal document."));

      setVersion("");
      setContentURL("");
      await load();
      setMessage("Legal document version published (previous active version deactivated).");
    } catch (e: any) {
      setError(e?.message || "Failed to publish legal document.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading legal docs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Legal & Policies</h1>
        <p className="text-muted-foreground">
          Publish new versions of Terms, Privacy, and DPA. Users will be prompted to accept required docs at next login.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Workflow: publish a new version, verify it is active, and confirm users accept required documents on next sign-in.
        </p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-foreground">Publish New Version</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={busy}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-60"
            >
              Refresh
            </button>
            <span className="text-xs text-muted-foreground">
              {rows.length} version(s){lastLoadedAt ? ` · ${new Date(lastLoadedAt).toLocaleTimeString()}` : ""}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            value={docKey}
            onChange={(e) => setDocKey((e.target.value as any) || "terms")}
          >
            {DOC_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Version (e.g. 2026-02-17)"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <input
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="Content URL (https://...)"
            value={contentURL}
            onChange={(e) => setContentURL(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={requiresAcceptance} onChange={(e) => setRequiresAcceptance(e.target.checked)} />
            Requires acceptance at login
          </label>
          <div className="flex items-center justify-end">
            <button
              onClick={() => void publish()}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {busy ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {DOC_OPTIONS.map((o) => {
          const versions = grouped[o.key] || [];
          return (
            <div key={o.key} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{o.label}</h2>
                <span className="text-xs text-muted-foreground">{versions.length} versions</span>
              </div>
              <div className="mt-3 space-y-2">
                {versions.length === 0 && <div className="text-sm text-muted-foreground">No versions published yet.</div>}
                {versions.map((v) => (
                  <div key={v.id} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{v.version}</span>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">{v.is_active ? "active" : "inactive"}</span>
                          <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                            {v.requires_acceptance ? "acceptance required" : "informational"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{v.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground break-all">{v.content_url}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Published: {new Date(v.published_at).toLocaleString()}</p>
                      </div>
                      <a
                        href={v.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                      >
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
