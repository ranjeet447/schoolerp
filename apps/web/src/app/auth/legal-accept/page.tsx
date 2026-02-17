"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@schoolerp/ui";
import Link from "next/link";

type LegalRequirement = {
  doc_key: string;
  title: string;
  version: string;
  content_url: string;
  published_at?: string | null;
};

type LoginResult = {
  token: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  permissions?: string[];
  expires_at: string;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  code?: string;
  data?: LoginResult;
  meta?: any;
};

export default function LegalAcceptPage() {
  const router = useRouter();
  const [requirements, setRequirements] = useState<LegalRequirement[]>([]);
  const [preauthToken, setPreauthToken] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("legal_preauth_token") || "";
    const raw = localStorage.getItem("legal_requirements") || "[]";
    let reqs: LegalRequirement[] = [];
    try {
      const parsed = JSON.parse(raw);
      reqs = Array.isArray(parsed) ? parsed : [];
    } catch {
      reqs = [];
    }

    if (!token || reqs.length === 0) {
      router.replace("/auth/login");
      return;
    }

    setPreauthToken(token);
    setRequirements(reqs);

    const initial: Record<string, boolean> = {};
    for (const r of reqs) {
      initial[`${r.doc_key}:${r.version}`] = false;
    }
    setChecked(initial);
  }, [router]);

  const allChecked = useMemo(() => {
    const keys = Object.keys(checked);
    if (keys.length === 0) return false;
    return keys.every((k) => checked[k]);
  }, [checked]);

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await apiClient("/auth/legal/accept", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${preauthToken}`,
        },
        body: JSON.stringify({
          accept: requirements.map((r) => ({ doc_key: r.doc_key, version: r.version })),
        }),
      });

      const data: LoginResponse = await res.json().catch(() => ({ success: false, message: "Invalid response" }));
      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.message || "Unable to accept legal documents.");
      }

      localStorage.setItem("auth_token", data.data.token);
      localStorage.setItem("user_id", data.data.user_id);
      localStorage.setItem("user_email", data.data.email);
      localStorage.setItem("user_name", data.data.full_name);
      localStorage.setItem("user_role", data.data.role);
      localStorage.setItem("tenant_id", data.data.tenant_id);
      if (data.data.permissions) {
        localStorage.setItem("user_permissions", JSON.stringify(data.data.permissions));
      } else {
        localStorage.removeItem("user_permissions");
      }

      localStorage.removeItem("legal_preauth_token");
      localStorage.removeItem("legal_requirements");

      router.push("/");
    } catch (e: any) {
      setError(e?.message || "Unable to accept legal documents.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accept Updated Legal Documents</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            To continue, you must review and accept the following documents.
          </p>
        </div>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="space-y-3">
            {requirements.map((r) => {
              const key = `${r.doc_key}:${r.version}`;
              return (
                <label key={key} className="flex gap-3 rounded-lg border border-border bg-background/40 p-3">
                  <input
                    type="checkbox"
                    checked={!!checked[key]}
                    onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                    className="mt-1"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Version: {r.version}</p>
                    <div className="mt-2">
                      <Link
                        href={r.content_url}
                        target="_blank"
                        className="text-sm font-semibold text-primary hover:text-primary/80"
                      >
                        Open document
                      </Link>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/auth/login"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Back to login
          </Link>
          <Button disabled={!allChecked || busy} onClick={() => void accept()}>
            {busy ? "Submitting..." : "I Agree and Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

