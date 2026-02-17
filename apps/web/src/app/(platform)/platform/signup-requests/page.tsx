"use client";

import { useEffect, useState } from "react";
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

export default function PlatformSignupRequestsPage() {
  const [rows, setRows] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [busyId, setBusyId] = useState("");
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}&limit=200` : "?limit=200";
      const res = await apiClient(`/admin/platform/signup-requests${q}`);
      if (!res.ok) {
        setError("Failed to load signup requests.");
        return;
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const res = await apiClient(`/admin/platform/signup-requests/${id}/review`, {
        method: "POST",
        body: JSON.stringify({
          status,
          review_notes: notesById[id] || "",
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
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
          <h1 className="text-3xl font-bold text-white">Signup Requests</h1>
          <p className="text-slate-400">Approve or reject pending school onboarding requests.</p>
        </div>
        <select
          className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
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
        <div className="rounded border border-emerald-700 bg-emerald-950/30 p-3 text-sm text-emerald-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-700 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-300">
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
                <td className="px-4 py-6 text-slate-400" colSpan={7}>
                  Loading signup requests...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-400" colSpan={7}>
                  No signup requests found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{row.school_name}</div>
                    <div className="text-xs text-slate-400">{new Date(row.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{row.contact_name || "-"}</div>
                    <div className="text-xs text-slate-400">{row.contact_email}</div>
                    <div className="text-xs text-slate-500">{row.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {row.city || "-"}
                    {row.country ? `, ${row.country}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.student_count_range || "-"}</td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{row.status}</td>
                  <td className="px-4 py-3">
                    <input
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
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
                        onClick={() => review(row.id, "approved")}
                        className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-900/20 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={busyId === row.id || row.status === "rejected"}
                        onClick={() => review(row.id, "rejected")}
                        className="rounded border border-red-700 px-2 py-1 text-xs text-red-200 hover:bg-red-900/20 disabled:opacity-50"
                      >
                        Reject
                      </button>
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
