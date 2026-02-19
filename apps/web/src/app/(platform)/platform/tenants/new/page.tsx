"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Input, 
  Label 
} from "@schoolerp/ui";
import { Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { PlanSelect } from "@/components/ui/plan-select";

export default function PlatformCreateTenantPage() {
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    subdomain: "",
    domain: "",
    plan_code: "",
    admin_name: "",
    admin_email: "",
    admin_phone: "",
    password: "",
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTenantId(null);

    try {
      const payload: any = { ...form };
      if (!payload.plan_code) delete payload.plan_code;
      if (!payload.domain) delete payload.domain;
      if (!payload.admin_phone) delete payload.admin_phone;

      const res = await apiClient("/admin/tenants/onboard", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setTenantId(data.tenant_id || null);
    } catch (err: any) {
      setError(err?.message || "Failed to create tenant.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (tenantId) {
      navigator.clipboard.writeText(tenantId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 container py-10">
      <div className="flex items-center gap-4">
        <Link href="/platform/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Onboard Tenant</h1>
          <p className="text-muted-foreground">Provision a new school environment and admin account.</p>
        </div>
      </div>

      {tenantId ? (
        <Card className="border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                    <Check className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Tenant Created Successfully!</h2>
                <div className="flex items-center gap-2 mt-2 bg-background/50 p-2 rounded-md border border-emerald-500/30">
                    <code className="text-sm font-mono">{tenantId}</code>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyToClipboard}>
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                </div>
                <div className="flex gap-4 mt-6">
                    <Link href={`/platform/tenants/${tenantId}`}>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            Open Tenant Details
                        </Button>
                    </Link>
                    <Link href="/platform/tenants">
                         <Button variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10">
                            Back to List
                        </Button>
                    </Link>
                </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Details</CardTitle>
            <CardDescription>Enter the school organization details.</CardDescription>
          </CardHeader>
          <CardContent>
             {error && (
                <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive font-medium flex items-center gap-2">
                   <div className="h-1 w-1 rounded-full bg-destructive" />
                   {error}
                </div>
              )}

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                        id="name"
                        placeholder="e.g. Springfield High"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex">
                        <Input
                            id="subdomain"
                            placeholder="springfield"
                            className="rounded-r-none"
                            value={form.subdomain}
                            onChange={(e) => setForm((p) => ({ ...p, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                            required
                        />
                        <div className="flex items-center px-3 border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm">
                            .schoolerp.com
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="domain">Custom Domain (Optional)</Label>
                    <Input
                        id="domain"
                        placeholder="portal.springfield.edu"
                        value={form.domain}
                        onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Initial Plan</Label>
                    <PlanSelect 
                        value={form.plan_code}
                        onSelect={(v) => setForm(p => ({ ...p, plan_code: v }))}
                        placeholder="Select a plan..."
                    />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Admin Account</span>
                </div>
              </div>

               <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="admin_name">Full Name</Label>
                    <Input
                        id="admin_name"
                        placeholder="Principal Skinner"
                        value={form.admin_name}
                        onChange={(e) => setForm((p) => ({ ...p, admin_name: e.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin_email">Email Address</Label>
                    <Input
                        id="admin_email"
                        type="email"
                        placeholder="admin@springfield.edu"
                        value={form.admin_email}
                        onChange={(e) => setForm((p) => ({ ...p, admin_email: e.target.value }))}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin_phone">Phone (Optional)</Label>
                    <Input
                        id="admin_phone"
                        type="tel"
                        placeholder="+1 555-0123"
                        value={form.admin_phone}
                        onChange={(e) => setForm((p) => ({ ...p, admin_phone: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                     <Label htmlFor="password">Initial Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        required
                        minLength={8}
                    />
                    <p className="text-[10px] text-muted-foreground">Must be at least 8 characters</p>
                </div>
               </div>

               <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={loading} size="lg">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Tenant
                  </Button>
               </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
