"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
  Building2,
  Search,
  MapPin,
  Users,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@schoolerp/ui";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type PlatformTenant = {
  id: string;
  name: string;
  subdomain: string;
  domain?: string;
  is_active: boolean;
  created_at: string;
  lifecycle_status: string;
  plan_code?: string;
  region?: string;
  branch_count: number;
  student_count: number;
  employee_count: number;
  total_collections: number;
};

type TenantFilters = {
  search: string;
  plan_code: string;
  status: "all" | "trial" | "active" | "suspended" | "closed";
  region: string;
  created_from: string;
  created_to: string;
  include_inactive: boolean;
  sort: string;
  order: string;
  limit: number;
  offset: number;
};

const initialFilters: TenantFilters = {
  search: "",
  plan_code: "",
  status: "all",
  region: "",
  created_from: "",
  created_to: "",
  include_inactive: true,
  sort: "created_at",
  order: "desc",
  limit: 50,
  offset: 0,
};

function normalizeLifecycleStatus(raw: string): "trial" | "active" | "suspended" | "closed" {
  switch ((raw || "").toLowerCase()) {
    case "active":
    case "suspended":
    case "closed":
    case "trial":
      return raw.toLowerCase() as "trial" | "active" | "suspended" | "closed";
    default:
      return "trial";
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const text = await res.text();
    return text?.trim() || `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

export default function PlatformTenantsPage() {
  const [filters, setFilters] = useState<TenantFilters>(initialFilters);
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  const debouncedPlanCode = useDebouncedValue(filters.plan_code, 300);
  const debouncedRegion = useDebouncedValue(filters.region, 300);
  const [rows, setRows] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyTenantId, setBusyTenantId] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (debouncedPlanCode) params.set("plan_code", debouncedPlanCode);
    if (filters.status !== "all") params.set("status", filters.status);
    if (debouncedRegion) params.set("region", debouncedRegion);
    if (filters.created_from) params.set("created_from", filters.created_from);
    if (filters.created_to) params.set("created_to", filters.created_to);
    if (filters.include_inactive) params.set("include_inactive", "true");
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.order) params.set("order", filters.order);
    params.set("limit", String(filters.limit));
    params.set("offset", String(filters.offset));
    return params.toString();
  }, [
    debouncedPlanCode,
    debouncedRegion,
    debouncedSearch,
    filters.created_from,
    filters.created_to,
    filters.include_inactive,
    filters.limit,
    filters.offset,
    filters.order,
    filters.sort,
    filters.status,
  ]);

  const loadTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient(`/admin/platform/tenants${query ? `?${query}` : ""}`);
      if (!res.ok) {
        setRows([]);
        setError(await parseErrorMessage(res));
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
        return;
      }
      if (Array.isArray(data?.items)) {
        setRows(data.items);
        return;
      }
      if (Array.isArray(data?.data)) {
        setRows(data.data);
        return;
      }
      setRows([]);
    } catch (err: unknown) {
      setRows([]);
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateLifecycle = async (tenantId: string, status: "trial" | "active" | "suspended" | "closed") => {
    setBusyTenantId(tenantId);
    setError("");
    try {
      const res = await apiClient(`/admin/platform/tenants/${tenantId}/lifecycle`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(await parseErrorMessage(res));
        return;
      }
      await loadTenants();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update tenant lifecycle");
    } finally {
      setBusyTenantId("");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <Link href="/platform/tenants" className="flex items-center text-xs font-black text-primary hover:underline gap-1 uppercase tracking-widest">
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back to Portfolio Dashboard
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Tenant Ecosystem</h1>
            <p className="mt-1 text-lg text-muted-foreground font-medium">Manage school registrations, lifecycle states, and resource mapping.</p>
          </div>
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href="/platform/tenants/new">
              <Plus className="mr-2 h-5 w-5" />
              Add New School
            </Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2 text-sm font-semibold text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadTenants()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by school or domain..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, offset: 0 }))}
              />
            </div>

            <Input
              placeholder="Plan (e.g. pro)"
              value={filters.plan_code}
              onChange={(e) => setFilters((prev) => ({ ...prev, plan_code: e.target.value, offset: 0 }))}
            />

            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((prev) => ({ ...prev, status: v as TenantFilters["status"], offset: 0 }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: All</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Region"
              value={filters.region}
              onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value, offset: 0 }))}
            />

            <Button variant="outline" className="w-full" onClick={() => setFilters(initialFilters)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
          <Filter className="h-4 w-4" />
          <span>Active Filters Applied</span>
          {filters.search && <Badge variant="secondary">Search: {filters.search}</Badge>}
          {filters.status !== "all" && <Badge variant="secondary">Status: {filters.status}</Badge>}
          {filters.plan_code && <Badge variant="secondary">Plan: {filters.plan_code}</Badge>}
          {filters.region && <Badge variant="secondary">Region: {filters.region}</Badge>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setFilters((p) => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}
              disabled={loading || filters.offset <= 0}
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
            <div className="mx-2 text-sm font-bold min-w-[60px] text-center">
              {filters.offset / filters.limit + 1}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setFilters((p) => ({ ...p, offset: p.offset + p.limit }))}
              disabled={loading || rows.length < filters.limit}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">School Information</TableHead>
              <TableHead>Service Plan</TableHead>
              <TableHead>Lifecycle</TableHead>
              <TableHead>Geography</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead className="text-right pr-6">Management</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
                  {error ? "Tenant list request failed. Please retry." : "No institutional tenants found matching your current criteria."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((t) => (
                <TableRow key={t.id} className="group transition-colors hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/5 p-2 text-primary group-hover:bg-primary/10">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{t.name}</div>
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          {t.subdomain}.schoolerp.com
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-semibold uppercase text-xs">{t.plan_code || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={t.lifecycle_status === "active" ? "default" : t.lifecycle_status === "suspended" ? "outline" : "secondary"}
                      className="capitalize font-bold text-[10px]"
                    >
                      {t.lifecycle_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {t.region || "Global"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <div className="flex items-center gap-1.5" title="Students">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        {t.student_count}
                      </div>
                      <div className="flex items-center gap-1.5" title="Revenue">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        ₹{Number(t.total_collections || 0).toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="secondary" size="sm" className="h-8">
                        <Link href={`/platform/tenants/${t.id}`}>Open Panel</Link>
                      </Button>
                      <Select
                        value={normalizeLifecycleStatus(t.lifecycle_status)}
                        onValueChange={(v) => void updateLifecycle(t.id, v as "trial" | "active" | "suspended" | "closed")}
                        disabled={busyTenantId === t.id}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trial">Trial</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspend</SelectItem>
                          <SelectItem value="closed">Close</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
