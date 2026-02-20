"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

type SignupRequest = {
  id: string;
  school_name: string;
  contact_name?: string;
  contact_email: string;
  phone?: string;
  city?: string;
  country?: string;
  student_count_range?: string;
  status: string;
  review_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
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
    // ignore parse failure and fallback
  }
  return fallback;
}

function makeSubdomain(source: string): string {
  const base = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  return base || "school";
}

export default function PlatformSignupRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [busyId, setBusyId] = useState("");
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastLoadedAt, setLastLoadedAt] = useState<string>("");

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}&limit=200` : "?limit=200";
      const res = await apiClient(`/admin/platform/signup-requests${q}`);
      if (!res.ok) {
        setError(await readAPIError(res, "Failed to load signup requests."));
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setLastLoadedAt(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const goToOnboarding = (row: SignupRequest) => {
    const params = new URLSearchParams();
    params.set("signup_request_id", row.id);
    params.set("school_name", row.school_name || "");
    params.set("subdomain", makeSubdomain(row.school_name || ""));
    params.set("admin_name", row.contact_name || "");
    params.set("admin_email", row.contact_email || "");
    params.set("admin_phone", row.phone || "");
    params.set("city", row.city || "");
    params.set("country", row.country || "");
    router.push(`/platform/tenants/new?${params.toString()}`);
  };

  const review = async (row: SignupRequest, status: "approved" | "rejected") => {
    setBusyId(row.id);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/signup-requests/${row.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          status,
          review_notes: notesById[row.id] || "",
        }),
      });
      if (!res.ok) {
        throw new Error(await readAPIError(res, "Failed to update signup request."));
      }
      if (status === "approved") {
        setMessage("Signup request approved. Continuing to tenant onboarding.");
        goToOnboarding(row);
        return;
      }
      setMessage(`Signup request ${status}.`);
      await loadRows();
    } catch (e: any) {
      setError(e?.message || "Failed to update signup request.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Signup Requests</h1>
          <p className="text-muted-foreground">
            Review school interest requests and continue approved requests into tenant onboarding.
          </p>
          {lastLoadedAt && (
            <p className="mt-1 text-xs text-muted-foreground">Last refresh: {new Date(lastLoadedAt).toLocaleTimeString()}</p>
          )}
        </div>
        <select
          className="rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
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

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Review Notes</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  Loading signup requests...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                  No signup requests found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{row.school_name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <div>{row.contact_name || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row.contact_email}</div>
                    <div className="text-xs text-muted-foreground">{row.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.city || "-"}
                    {row.country ? `, ${row.country}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.student_count_range || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{row.status}</td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
                      value={notesById[row.id] ?? row.review_notes ?? ""}
                      onChange={(e) =>
                        setNotesById((prev) => ({
                          ...prev,
                          [row.id]: e.target.value,
                        }))
                      }
                      placeholder="Optional notes"
                      disabled={busyId === row.id}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === row.id || row.status === "approved"}
                        onClick={() => review(row, "approved")}
                        className="rounded border border-emerald-600/40 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                      >
                        Approve & Onboard
                      </button>
                      <button
                        disabled={busyId === row.id || row.status === "rejected"}
                        onClick={() => review(row, "rejected")}
                        className="rounded border border-red-600/40 px-2 py-1 text-xs text-red-700 hover:bg-red-500/10 disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/20"
                      >
                        Reject
                      </button>
                      {row.status === "approved" && (
                        <button
                          disabled={busyId === row.id}
                          onClick={() => goToOnboarding(row)}
                          className="rounded border border-indigo-600/40 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-500/10 disabled:opacity-50 dark:border-indigo-700 dark:text-indigo-200 dark:hover:bg-indigo-900/20"
                        >
                          Continue Onboarding
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
