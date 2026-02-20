"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import {
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@schoolerp/ui"
import { toast } from "sonner"
import { Loader2, MoreHorizontal, UserCog, Search, Key, RefreshCw } from "lucide-react"
import { TenantSelect } from "@/components/ui/tenant-select"
import { ResetPasswordDialog } from "./_components/reset-password-dialog"
import { useDebouncedValue } from "@/lib/use-debounced-value"

const TENANT_ROLE_OPTIONS = [
  { value: "tenant_admin", label: "Tenant Admin" },
  { value: "branch_admin", label: "Branch Admin" },
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
  { value: "accountant", label: "Accountant" },
  { value: "parent", label: "Parent" },
  { value: "student", label: "Student" },
]

export default function GlobalUserDirectoryPage() {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [tenantId, setTenantId] = useState("")
  const [roleCode, setRoleCode] = useState("")
  const [page, setPage] = useState(0)
  const limit = 20

  // Dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null)

  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false)
  const [selectedUserForImpersonate, setSelectedUserForImpersonate] = useState<any>(null)
  const [impersonateReason, setImpersonateReason] = useState("")

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["global-users", debouncedSearch, tenantId, roleCode, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        tenant_id: tenantId,
        role_code: roleCode,
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      const res = await apiClient(`/admin/platform/users?${params.toString()}`)
      if (!res.ok) {
        throw new Error(await res.text())
      }
      return (await res.json()) || []
    },
  })

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await apiClient(`/admin/platform/users/${userId}/impersonate`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error(await res.text())
      return await res.json()
    },
    onSuccess: (data) => {
      toast.success("Impersonation session created", {
        description: "Setting up context and redirecting...",
      })
      // Store impersonator context for return
      localStorage.setItem("impersonator_auth_token", localStorage.getItem("auth_token") || "")
      localStorage.setItem("impersonator_user_role", localStorage.getItem("user_role") || "")
      localStorage.setItem("impersonator_tenant_id", localStorage.getItem("tenant_id") || "")
      localStorage.setItem("impersonation_started_at", new Date().toISOString())
      localStorage.setItem("impersonation_reason", impersonateReason)
      // Set impersonated context
      if (data.token) localStorage.setItem("auth_token", data.token)
      if (data.target_tenant_id) localStorage.setItem("tenant_id", data.target_tenant_id)
      if (data.target_user_id) localStorage.setItem("user_id", data.target_user_id)
      localStorage.setItem("user_role", "tenant_admin")
      window.location.href = "/admin/dashboard"
    },
    onError: (err: any) => {
      toast.error("Impersonation failed", {
        description: err.message || "An error occurred",
      })
    },
  })

  const handleImpersonate = () => {
    if (!selectedUserForImpersonate || !impersonateReason.trim()) return
    impersonateMutation.mutate({
      userId: selectedUserForImpersonate.id,
      reason: impersonateReason.trim(),
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global User Directory</h1>
          <p className="text-muted-foreground">
            Search, manage, and impersonate users across all tenants.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-[300px]">
          <TenantSelect
            value={tenantId}
            onSelect={(val) => setTenantId(typeof val === "string" ? val : val[0] || "")}
            placeholder="Filter by tenant"
            includeInactive
          />
        </div>
        <div className="w-[180px]">
          <Select
            value={roleCode || "__all__"}
            onValueChange={(value) => setRoleCode(value === "__all__" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All roles</SelectItem>
              {TENANT_ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : (users?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.tenant_name ? (
                      <span>{user.tenant_name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Platform</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role_name ? (
                      <Badge variant="outline" className="capitalize">
                        {(user.role_name || "").replace(/_/g, " ")}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_login ? new Date(user.last_login).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUserForImpersonate(user)
                            setImpersonateReason("")
                            setImpersonateDialogOpen(true)
                          }}
                          disabled={!user.is_active}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast.info("Role updates are managed in each tenant context.")
                          }}
                        >
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUserForReset(user)
                            setResetDialogOpen(true)
                          }}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((p) => p + 1)}
          disabled={(users?.length ?? 0) < limit}
        >
          Next
        </Button>
      </div>

      {/* Impersonation Dialog */}
      <Dialog open={impersonateDialogOpen} onOpenChange={setImpersonateDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Impersonate User</DialogTitle>
            <DialogDescription>
              You are about to impersonate{" "}
              <span className="font-semibold">{selectedUserForImpersonate?.full_name}</span>.
              A reason is required for audit compliance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="impersonate-reason">Reason (required)</Label>
              <Textarea
                id="impersonate-reason"
                value={impersonateReason}
                onChange={(e) => setImpersonateReason(e.target.value)}
                placeholder="e.g. Debugging billing issue reported in ticket #1234"
                className="min-h-[80px]"
              />
              {impersonateReason.length > 0 && impersonateReason.trim().length < 10 && (
                <p className="text-xs text-destructive">Reason must be at least 10 characters.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImpersonate}
              disabled={impersonateReason.trim().length < 10 || impersonateMutation.isPending}
            >
              {impersonateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      {selectedUserForReset && (
        <ResetPasswordDialog
          open={resetDialogOpen}
          onOpenChange={setResetDialogOpen}
          userId={selectedUserForReset.id}
          userName={selectedUserForReset.full_name}
        />
      )}
    </div>
  )
}
