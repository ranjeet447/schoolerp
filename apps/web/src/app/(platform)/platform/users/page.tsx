"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Input,
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
  Badge
} from "@schoolerp/ui"
import { toast } from "sonner"
import { Loader2, MoreHorizontal, UserCog, ShieldCheck, Search, Key } from "lucide-react"
import { TenantSelect } from "@/components/ui/tenant-select"
import { useRouter } from "next/navigation"
import { ResetPasswordDialog } from "./_components/reset-password-dialog"

export default function GlobalUserDirectoryPage() {
  const [search, setSearch] = useState("")
  const [tenantId, setTenantId] = useState("")
  const [roleCode, setRoleCode] = useState("")
  const [page, setPage] = useState(0)
  const limit = 20

  // const { toast } = useToast() // Removed hook
  const router = useRouter()
  const queryClient = useQueryClient()

  // State for Reset Password Dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ["global-users", search, tenantId, roleCode, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        tenant_id: tenantId,
        role_code: roleCode,
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      const res = await apiClient(`/platform/users?${params.toString()}`)
      return (await res.json()) || []
    },
  })

  // Mutations
  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient(`/platform/users/${userId}/impersonate`, {
        method: "POST",
        body: JSON.stringify({
          reason: "Platform Admin Impersonation",
        }),
      })
      return await res.json()
    },
    onSuccess: (data) => {
      toast.success("Impersonation Token Created", {
        description: "Redirecting to tenant...",
      })
      // Direct redirect approach
      // Ideally, the token should be used to set a cookie or auth header.
      // If the token is a login token for the target app, we might need a special redirect URL.
      // For now, we simulate the redirect by logging the token and showing a success message.
      // In a real implementation, this would redirect to: `https://{tenant_subdomain}.schoolerp.com/auth/impersonate?token={token}`
      console.log("Impersonation Token:", data.token)
      toast.success("Impersonation Link Generated", {
        description: "Check console for token (Simulation Mode)",
      })
    },
    onError: (err: any) => {
      toast.error("Failed to impersonate", {
        description: err.response?.data || err.message,
      })
    },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global User Directory</h1>
          <p className="text-muted-foreground">
            Search, manage, and impersonate users across all tenants.
          </p>
        </div>
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
        {/* Role Select could go here */}
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
            ) : users?.length === 0 ? (
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
                      <div className="flex flex-col">
                        <span>{user.tenant_name}</span>
                        {/* <span className="text-xs text-muted-foreground">ID: {user.tenant_id}</span> */}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Platform / None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.role_name ? (
                      <Badge variant="outline">{user.role_name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                   <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem 
                          onClick={() => impersonateMutation.mutate(user.id)}
                          disabled={!user.is_active}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Impersonate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem onClick={() => {
                            setSelectedUserForReset(user)
                            setResetDialogOpen(true)
                         }}>
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
          disabled={users?.length < limit}
        >
          Next
        </Button>
      </div>

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
