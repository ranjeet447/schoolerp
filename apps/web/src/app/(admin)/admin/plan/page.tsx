"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Badge, Button, Card, CardContent } from "@schoolerp/ui";
import { Layers3, RefreshCcw } from "lucide-react";

type TenantPlanSummary = {
  id: string;
  name: string;
  subdomain: string;
  lifecycle_status: string;
  plan_code: string;
};

type PlatformPlan = {
  id: string;
  code: string;
  name: string;
  description?: string;
  price_monthly: number;
  price_yearly: number;
  limits?: Record<string, unknown>;
  modules?: Record<string, unknown>;
  feature_flags?: Record<string, unknown>;
  is_active: boolean;
};

type PlanPayload = {
  tenant: TenantPlanSummary;
  plans: PlatformPlan[];
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AdminPlanPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tenant, setTenant] = useState<TenantPlanSummary | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient("/admin/tenant/plan");
      if (!res.ok) {
        throw new Error("Failed to load plan details.");
      }
      const data: PlanPayload = await res.json();
      setTenant(data?.tenant || null);
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
    } catch (err: any) {
      setError(err?.message || "Failed to load plan details.");
      setTenant(null);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const currentPlan = useMemo(
    () => plans.find((plan) => plan.code === tenant?.plan_code),
    [plans, tenant?.plan_code]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Platform Plan</h1>
          <p className="text-sm text-muted-foreground">
            Active SchoolERP plan and available plan catalog for your school account.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current plan</p>
            <h2 className="mt-2 text-xl font-black text-foreground">
              {currentPlan?.name || tenant?.plan_code || "Unassigned"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {tenant?.lifecycle_status || "unknown"}
              </Badge>
              <Badge variant="outline">{tenant?.subdomain || "-"}</Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              To change plan, contact platform support or raise a billing request.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pricing snapshot</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="text-base font-bold text-foreground">{formatMoney(currentPlan?.price_monthly || 0)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Yearly</p>
                <p className="text-base font-bold text-foreground">{formatMoney(currentPlan?.price_yearly || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading plan catalog...</CardContent>
          </Card>
        ) : (
          plans.map((plan) => {
            const isCurrent = plan.code === tenant?.plan_code;
            const limitsCount = Object.keys(plan.limits || {}).length;
            const modulesCount = Object.keys(plan.modules || {}).length;
            return (
              <Card
                key={plan.id}
                className={`border shadow-sm transition-colors ${isCurrent ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{plan.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrent ? <Badge>Current</Badge> : null}
                      {!plan.is_active ? <Badge variant="secondary">Inactive</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan.description || "No plan description provided."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <Layers3 className="h-3.5 w-3.5" />
                      {modulesCount} modules
                    </span>
                    <span className="rounded-md bg-muted px-2 py-1">{limitsCount} limits</span>
                    <span className="rounded-md bg-muted px-2 py-1">{formatMoney(plan.price_monthly)} / month</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
