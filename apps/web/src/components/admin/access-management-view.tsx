"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, Shield, Users } from "lucide-react";

type AccessTab = "users" | "roles" | "permissions";

type UserRole = {
  id: string;
  email: string;
  full_name: string;
  role_code: string;
  is_active: boolean;
};

type Role = {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
  permissions: string[];
};

type Permission = {
  id: string | number;
  code: string;
  module: string;
  description: string;
};

const TAB_ROUTES: Record<AccessTab, string> = {
  users: "/admin/settings/users",
  roles: "/admin/settings/roles",
  permissions: "/admin/settings/permissions",
};

function resolveTabFromPath(pathname: string): AccessTab {
  if (pathname.startsWith("/admin/settings/roles")) return "roles";
  if (pathname.startsWith("/admin/settings/permissions")) return "permissions";
  return "users";
}

function canManageSystemRole(roleCode: string): boolean {
  const code = String(roleCode || "").trim().toLowerCase();
  return code === "teacher" || code === "parent" || code === "student";
}

function groupByModule(items: Permission[]): Record<string, Permission[]> {
  return items.reduce<Record<string, Permission[]>>((acc, item) => {
    const key = item.module || "misc";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default function AccessManagementView() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccessTab>(resolveTabFromPath(pathname));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [users, setUsers] = useState<UserRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [roleSearch, setRoleSearch] = useState("");

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [selectedRoleID, setSelectedRoleID] = useState("");

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState("");

  useEffect(() => {
    setActiveTab(resolveTabFromPath(pathname));
  }, [pathname]);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        apiClient("/admin/roles/users"),
        apiClient("/admin/roles"),
        apiClient("/admin/permissions"),
      ]);

      if (!usersRes.ok) throw new Error((await usersRes.text()) || "Failed to load users");
      if (!rolesRes.ok) throw new Error((await rolesRes.text()) || "Failed to load roles");
      if (!permsRes.ok) throw new Error((await permsRes.text()) || "Failed to load permissions");

      setUsers(await usersRes.json());
      setRoles(await rolesRes.json());
      setPermissions(await permsRes.json());
    } catch (err: any) {
      const message = err?.message || "Failed to load access data.";
      setError(message);
      if (silent) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load(false);
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter((user) => {
      const fullName = String(user.full_name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const roleCode = String(user.role_code || "").toLowerCase();
      const matchesQuery = !q || fullName.includes(q) || email.includes(q) || roleCode.includes(q);
      const matchesRole = userRoleFilter === "all" || roleCode === userRoleFilter.toLowerCase();
      return matchesQuery && matchesRole;
    });
  }, [userSearch, userRoleFilter, users]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    return roles.filter((role) => {
      if (!q) return true;
      return (
        String(role.name || "").toLowerCase().includes(q) ||
        String(role.code || "").toLowerCase().includes(q) ||
        String(role.description || "").toLowerCase().includes(q)
      );
    });
  }, [roles, roleSearch]);

  const groupedPermissions = useMemo(() => groupByModule(permissions), [permissions]);

  const openAssignDialog = (user: UserRole) => {
    setSelectedUser(user);
    const assignedRole = roles.find((r) => String(r.code || "").toLowerCase() === String(user.role_code || "").toLowerCase());
    setSelectedRoleID(assignedRole?.id || "");
    setAssignDialogOpen(true);
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRoleID) return;
    setAssigning(true);
    try {
      const res = await apiClient("/admin/roles/assign", {
        method: "POST",
        body: JSON.stringify({ user_id: selectedUser.id, role_id: selectedRoleID }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Failed to assign role");
      toast.success(`Role updated for ${selectedUser.full_name}`);
      setAssignDialogOpen(false);
      await load(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  const openCreateRoleDialog = () => {
    setEditingRole(null);
    setFormName("");
    setFormCode("");
    setFormDescription("");
    setFormPermissions([]);
    setPermissionSearch("");
    setRoleDialogOpen(true);
  };

  const openEditRoleDialog = (role: Role) => {
    if (role.is_system && !canManageSystemRole(role.code)) {
      toast.error("This system role is read-only");
      return;
    }
    setEditingRole(role);
    setFormName(role.name || "");
    setFormCode(role.code || "");
    setFormDescription(role.description || "");
    setFormPermissions(Array.isArray(role.permissions) ? role.permissions : []);
    setPermissionSearch("");
    setRoleDialogOpen(true);
  };

  const togglePermission = (permissionCode: string) => {
    setFormPermissions((prev) =>
      prev.includes(permissionCode) ? prev.filter((code) => code !== permissionCode) : [...prev, permissionCode]
    );
  };

  const filteredPermissionGroups = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return groupedPermissions;
    const next: Record<string, Permission[]> = {};
    Object.entries(groupedPermissions).forEach(([module, items]) => {
      const matches = items.filter(
        (item) =>
          String(item.code || "").toLowerCase().includes(query) ||
          String(item.module || "").toLowerCase().includes(query) ||
          String(item.description || "").toLowerCase().includes(query)
      );
      if (matches.length > 0) next[module] = matches;
    });
    return next;
  }, [groupedPermissions, permissionSearch]);

  const saveRole = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast.error("Role name and code are required");
      return;
    }

    setSavingRole(true);
    try {
      const endpoint = editingRole ? `/admin/roles/${editingRole.id}` : "/admin/roles";
      const method = editingRole ? "PUT" : "POST";
      const payload = editingRole
        ? {
            name: formName.trim(),
            description: formDescription.trim(),
            permissions: formPermissions,
          }
        : {
            name: formName.trim(),
            code: formCode.trim().toLowerCase().replace(/\s+/g, "_"),
            description: formDescription.trim(),
            permissions: formPermissions,
          };

      const res = await apiClient(endpoint, {
        method,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.text()) || "Failed to save role");
      toast.success(editingRole ? "Role updated" : "Role created");
      setRoleDialogOpen(false);
      await load(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save role");
    } finally {
      setSavingRole(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (role.is_system) return;
    try {
      const res = await apiClient(`/admin/roles/${role.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.text()) || "Failed to delete role");
      toast.success("Role deleted");
      await load(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete role");
    }
  };

  const goToTab = (tab: AccessTab) => {
    setActiveTab(tab);
    const target = TAB_ROUTES[tab];
    if (pathname !== target) {
      router.replace(target);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Access & RBAC</h1>
          <p className="text-sm text-muted-foreground">
            Manage tenant users, roles, and permission matrix from one control surface.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={activeTab === "users" ? "default" : "outline"} size="sm">
          <Link href="/admin/settings/users">User Directory</Link>
        </Button>
        <Button asChild variant={activeTab === "roles" ? "default" : "outline"} size="sm">
          <Link href="/admin/settings/roles">Role Management</Link>
        </Button>
        <Button asChild variant={activeTab === "permissions" ? "default" : "outline"} size="sm">
          <Link href="/admin/settings/permissions">Permission Catalog</Link>
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Users</p>
            <p className="mt-2 text-2xl font-black text-foreground">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Roles</p>
            <p className="mt-2 text-2xl font-black text-foreground">{roles.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Permissions</p>
            <p className="mt-2 text-2xl font-black text-foreground">{permissions.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => goToTab(v as AccessTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Shield className="h-4 w-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-[340px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, role"
                    className="pl-9"
                  />
                </div>
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={`filter-role-${role.id}`} value={role.code}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">User</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-muted-foreground" colSpan={4}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant="secondary">{user.role_code}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button size="sm" variant="outline" onClick={() => openAssignDialog(user)}>
                              Assign Role
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-[340px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Search roles by name/code/description"
                    className="pl-9"
                  />
                </div>
                <Button onClick={openCreateRoleDialog}>Create Role</Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Permissions</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-muted-foreground" colSpan={5}>
                          No roles found.
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((role) => {
                        const editable = !role.is_system || canManageSystemRole(role.code);
                        return (
                          <tr key={role.id}>
                            <td className="px-3 py-2">
                              <p className="font-medium text-foreground">{role.name}</p>
                              <p className="text-xs text-muted-foreground">{role.description || "No description"}</p>
                            </td>
                            <td className="px-3 py-2">
                              <code className="rounded bg-muted px-2 py-1 text-xs">{role.code}</code>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={role.is_system ? "secondary" : "default"}>
                                {role.is_system ? "System" : "Custom"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{(role.permissions || []).length}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditRoleDialog(role)}
                                  disabled={!editable}
                                >
                                  Edit
                                </Button>
                                {!role.is_system ? (
                                  <Button size="sm" variant="destructive" onClick={() => void deleteRole(role)}>
                                    Delete
                                  </Button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card className="border-none shadow-sm">
            <CardContent className="space-y-4 p-4">
              {Object.entries(groupedPermissions).length === 0 ? (
                <p className="text-sm text-muted-foreground">No permissions found.</p>
              ) : null}
              {Object.entries(groupedPermissions).map(([module, items]) => (
                <div key={`module-${module}`} className="rounded-lg border border-border p-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{module}</h3>
                  <div className="mt-3 space-y-2">
                    {items.map((permission) => (
                      <div key={`perm-${permission.code}`} className="rounded-md border border-border/80 bg-muted/20 p-2">
                        <p className="text-sm font-semibold text-foreground">{permission.code}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              {selectedUser ? `Update role for ${selectedUser.full_name}` : "Select a user role"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRoleID} onValueChange={setSelectedRoleID}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={`assign-role-${role.id}`} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={assignRole} disabled={assigning || !selectedRoleID}>
              {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
            <DialogDescription>Set role identity and permission matrix.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Front Office" />
              </div>
              <div className="space-y-2">
                <Label>Role Code</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. front_office"
                  disabled={Boolean(editingRole)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Brief role description"
              />
            </div>

            <div className="space-y-2">
              <Label>Filter permissions</Label>
              <Input
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                placeholder="Search by code, module, description"
              />
            </div>

            <div className="space-y-3">
              {Object.entries(filteredPermissionGroups).length === 0 ? (
                <p className="text-sm text-muted-foreground">No matching permissions.</p>
              ) : null}
              {Object.entries(filteredPermissionGroups).map(([module, items]) => (
                <div key={`editor-module-${module}`} className="rounded-lg border border-border p-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{module}</h3>
                  <div className="mt-2 grid gap-2">
                    {items.map((permission) => {
                      const checked = formPermissions.includes(permission.code);
                      return (
                        <button
                          type="button"
                          key={`editor-perm-${permission.code}`}
                          onClick={() => togglePermission(permission.code)}
                          className={`flex items-start justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                            checked ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{permission.code}</p>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                          <Badge variant={checked ? "default" : "secondary"}>{checked ? "On" : "Off"}</Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRole} disabled={savingRole}>
              {savingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
