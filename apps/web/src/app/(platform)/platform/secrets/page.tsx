"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type SecretsStatus = {
  jwt: {
    configured: boolean;
    env_var: string;
    count: number;
  };
  data_encryption: {
    configured: boolean;
    env_var: string;
    count: number;
  };
};

type SecretRotationRequest = {
  id: string;
  status: string;
  requested_by: string;
  requested_by_name?: string;
  requested_by_email?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_by_email?: string;
  payload?: {
    secret_name?: string;
    reason?: string;
    notes?: string;
    requested_at?: string;
    approved_at?: string;
    executed_at?: string;
    generated_format?: string;
    generated_fingerprint?: string;
    env_var?: string;
  };
  created_at: string;
  approved_at?: string;
};

type ExecuteResult = {
  request: SecretRotationRequest;
  generated_secret: string;
  env_var: string;
  instructions: string[];
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

export default function PlatformSecretsPage() {
  const [status, setStatus] = useState<SecretsStatus | null>(null);
  const [requests, setRequests] = useState<SecretRotationRequest[]>([]);
  const [secretName, setSecretName] = useState<"jwt" | "data_encryption">("jwt");
  const [reason, setReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [executeConfirmations, setExecuteConfirmations] = useState<Record<string, string>>({});
  const [lastExecuteResult, setLastExecuteResult] = useState<ExecuteResult | null>(null);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [statusRes, reqRes] = await Promise.all([
        apiClient("/admin/platform/security/secrets/status"),
        apiClient("/admin/platform/security/secret-rotations?limit=50"),
      ]);

      const loadErrors: string[] = [];
      if (statusRes.ok) {
        const data: SecretsStatus = await statusRes.json();
        setStatus(data);
      } else {
        setStatus(null);
        loadErrors.push(await readAPIError(statusRes, "Failed to load secret status."));
      }

      if (reqRes.ok) {
        const rows = await reqRes.json();
        setRequests(Array.isArray(rows) ? rows : []);
      } else {
        setRequests([]);
        loadErrors.push(await readAPIError(reqRes, "Failed to load rotation requests."));
      }

      if (loadErrors.length > 0) {
        setError(loadErrors.join(" "));
      }
      setLastLoadedAt(new Date().toISOString());
    } catch (e: any) {
      setStatus(null);
      setRequests([]);
      setError(e?.message || "Failed to load secrets status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createRequest = async () => {
    setError("");
    setMessage("");
    setLastExecuteResult(null);
    setBusyId("create");
    try {
      if (!reason.trim()) throw new Error("Reason is required.");
      const res = await apiClient("/admin/platform/security/secret-rotations", {
        method: "POST",
        body: JSON.stringify({ secret_name: secretName, reason: reason.trim() }),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to create rotation request."));
      setReason("");
      await load();
      setMessage("Rotation request created.");
    } catch (e: any) {
      setError(e?.message || "Failed to create rotation request.");
    } finally {
      setBusyId("");
    }
  };

  const reviewRequest = async (requestId: string, decision: "approve" | "reject") => {
    setError("");
    setMessage("");
    setLastExecuteResult(null);
    setBusyId(requestId);
    try {
      const notes = (reviewNotes[requestId] || "").trim();
      const res = await apiClient(`/admin/platform/security/secret-rotations/${requestId}/review`, {
        method: "POST",
        body: JSON.stringify({ decision, notes }),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to review rotation request."));
      setReviewNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      await load();
      setMessage(`Rotation request ${decision}d.`);
    } catch (e: any) {
      setError(e?.message || "Failed to review rotation request.");
    } finally {
      setBusyId("");
    }
  };

  const executeRequest = async (req: SecretRotationRequest) => {
    setError("");
    setMessage("");
    setLastExecuteResult(null);
    setBusyId(req.id);
    try {
      const secret = (req.payload?.secret_name || "").toUpperCase();
      const expected = `ROTATE ${secret}`;
      const confirmation = (executeConfirmations[req.id] || "").trim();
      if (!confirmation) throw new Error(`Confirmation required: ${expected}`);

      const res = await apiClient(`/admin/platform/security/secret-rotations/${req.id}/execute`, {
        method: "POST",
        body: JSON.stringify({ confirmation }),
      });
      if (!res.ok) throw new Error(await readAPIError(res, "Failed to execute rotation request."));
      const result: ExecuteResult = await res.json();

      setExecuteConfirmations((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
      setLastExecuteResult(result);
      await load();
      setMessage("Secret generated. Apply the instructions to complete rotation.");
    } catch (e: any) {
      setError(e?.message || "Failed to execute rotation request.");
    } finally {
      setBusyId("");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading secrets...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Secrets & Key Rotation</h1>
        <p className="text-muted-foreground">
          Request, approve, and execute platform secret rotation with audit logging and guardrails.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Workflow: request rotation, get approval from another admin, execute with typed confirmation, then update env vars and redeploy.
        </p>
      </div>

      {message && (
        <div className="rounded border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastExecuteResult && (
        <div className="rounded-xl border border-red-600/40 bg-card p-4 dark:border-red-700/50">
          <h2 className="text-sm font-semibold text-foreground">Generated Secret (Shown Once)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Apply the secret to your backend environment variable <span className="font-mono">{lastExecuteResult.env_var}</span> and redeploy.
          </p>
          <div className="mt-3 rounded border border-border bg-background/40 p-3 font-mono text-sm text-foreground break-all">
            {lastExecuteResult.generated_secret}
          </div>
          <div className="mt-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Instructions</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {lastExecuteResult.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Current Status</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded border border-border bg-background/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">JWT Secrets</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {status?.jwt?.configured ? "Configured" : "Not configured"} ({status?.jwt?.count ?? 0})
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Env: {status?.jwt?.env_var || "JWT_SECRETS"}</p>
            </div>
            <div className="rounded border border-border bg-background/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Data Encryption Keys</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {status?.data_encryption?.configured ? "Configured" : "Not configured"} ({status?.data_encryption?.count ?? 0})
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Env: {status?.data_encryption?.env_var || "DATA_ENCRYPTION_KEYS"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Rotation is operationally completed by updating the relevant env var on Render and redeploying.
          </p>
          {lastLoadedAt && (
            <p className="mt-1 text-xs text-muted-foreground">Last refreshed: {new Date(lastLoadedAt).toLocaleTimeString()}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground">Request Rotation</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a rotation request, then have a different admin approve it, then execute with typed confirmation.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-6">
            <select
              value={secretName}
              onChange={(e) => setSecretName(e.target.value === "data_encryption" ? "data_encryption" : "jwt")}
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground md:col-span-2"
            >
              <option value="jwt">JWT secrets</option>
              <option value="data_encryption">Data encryption keys</option>
            </select>
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground md:col-span-4"
              placeholder="Reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="md:col-span-6">
              <button
                type="button"
                onClick={() => void createRequest()}
                disabled={busyId === "create" || !reason.trim()}
                className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
              >
                Create Rotation Request
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-foreground">Rotation Requests</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {requests.length} request(s)
            </span>
            <button
              type="button"
              onClick={() => void load()}
              disabled={busyId !== ""}
              className="rounded border border-input px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Created</th>
                <th className="py-2">Secret</th>
                <th className="py-2">Status</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Requested By</th>
                <th className="py-2">Approved By</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={7}>
                    No rotation requests yet. Create one above to begin the request/approve/execute flow.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const secret = (req.payload?.secret_name || "-").toUpperCase();
                  const expected = `ROTATE ${secret}`;
                  return (
                    <tr key={req.id} className="border-t border-border">
                      <td className="py-2 text-muted-foreground">
                        {req.created_at ? new Date(req.created_at).toLocaleString() : "-"}
                      </td>
                      <td className="py-2 text-muted-foreground">{secret}</td>
                      <td className="py-2 text-muted-foreground">{req.status}</td>
                      <td className="py-2 text-muted-foreground">
                        <p>{req.payload?.reason || "-"}</p>
                        {req.payload?.notes && <p className="mt-1 text-xs">Notes: {req.payload.notes}</p>}
                        {req.payload?.generated_fingerprint && (
                          <p className="mt-1 text-xs font-mono">fp: {req.payload.generated_fingerprint}</p>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        <p>{req.requested_by_name || "-"}</p>
                        <p className="text-xs">{req.requested_by_email || req.requested_by || "-"}</p>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        <p>{req.approved_by_name || "-"}</p>
                        <p className="text-xs">{req.approved_by_email || req.approved_by || "-"}</p>
                      </td>
                      <td className="py-2">
                        {req.status === "pending" ? (
                          <div className="flex flex-col gap-2">
                            <input
                              className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                              placeholder="Review notes (optional)"
                              value={reviewNotes[req.id] || ""}
                              onChange={(e) => setReviewNotes((p) => ({ ...p, [req.id]: e.target.value }))}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void reviewRequest(req.id, "approve")}
                                disabled={busyId === req.id}
                                className="rounded border border-emerald-600/40 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-60 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => void reviewRequest(req.id, "reject")}
                                disabled={busyId === req.id}
                                className="rounded border border-red-600/40 px-3 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ) : req.status === "approved" ? (
                          <div className="flex flex-col gap-2">
                            <input
                              className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                              placeholder={`Type: ${expected}`}
                              value={executeConfirmations[req.id] || ""}
                              onChange={(e) =>
                                setExecuteConfirmations((p) => ({ ...p, [req.id]: e.target.value }))
                              }
                            />
                            <button
                              type="button"
                              onClick={() => void executeRequest(req)}
                              disabled={busyId === req.id}
                              className="rounded border border-red-600/40 px-3 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-60 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                            >
                              Execute
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
