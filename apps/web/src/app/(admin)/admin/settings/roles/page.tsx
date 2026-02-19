"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Lock,
  Unlock,
  Settings,
  Save,
  RefreshCw,
  Search,
  Loader2,
  Info
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch
} from '@schoolerp/ui';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface Role {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
  permissions: string[];
}

interface Permission {
  id: number;
  code: string;
  module: string;
  description: string;
}

function canTenantManageSystemRole(roleCode: string): boolean {
  const code = roleCode.trim().toLowerCase();
  return code === 'teacher' || code === 'parent' || code === 'student';
}

// Group permissions by module
function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}
export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient('/admin/roles'),
        apiClient('/admin/permissions'),
      ]);

      if (!rolesRes.ok) {
        const msg = await rolesRes.text();
        throw new Error(msg || 'Failed to load roles');
      }
      if (!permsRes.ok) {
        const msg = await permsRes.text();
        throw new Error(msg || 'Failed to load permissions');
      }

      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      setRoles(rolesData || []);
      setPermissions(permsData || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roles data';
      setError(message);
      if (silent) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setFormPermissions([]);
    setShowModal(true);
  };

  const openEditModal = (role: Role) => {
    if (role.is_system && !canTenantManageSystemRole(role.code)) {
      toast.error('System roles cannot be edited');
      return;
    }
    setEditingRole(role);
    setFormName(role.name);
    setFormCode(role.code);
    setFormDescription(role.description);
    setFormPermissions(role.permissions || []);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formCode) {
      toast.error('Name and code are required');
      return;
    }

    try {
      const url = editingRole 
        ? `/admin/roles/${editingRole.id}`
        : `/admin/roles`;
      
      const method = editingRole ? 'PUT' : 'POST';
      
      const body = editingRole
        ? { name: formName, description: formDescription, permissions: formPermissions }
        : { name: formName, code: formCode, description: formDescription, permissions: formPermissions };

      const res = await apiClient(url, {
        method,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingRole ? 'Role updated!' : 'Role created!');
        setShowModal(false);
        fetchData(true);
      } else {
        const error = await res.text();
        toast.error(error || 'Failed to save role');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      const res = await apiClient(`/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Role deleted');
        setDeleteConfirm(null);
        fetchData(true);
      } else {
        const error = await res.text();
        toast.error(error || 'Failed to delete role');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const togglePermission = (code: string) => {
    setFormPermissions(prev => 
      prev.includes(code) 
        ? prev.filter(p => p !== code)
        : [...prev, code]
    );
  };

  const toggleModulePermissions = (module: string, perms: Permission[]) => {
    const modulePermCodes = perms.map(p => p.code);
    const allSelected = modulePermCodes.every(code => formPermissions.includes(code));
    
    if (allSelected) {
      setFormPermissions(prev => prev.filter(code => !modulePermCodes.includes(code)));
    } else {
      setFormPermissions(prev => {
        const next = [...prev];
        modulePermCodes.forEach(code => {
          if (!next.includes(code)) next.push(code);
        });
        return next;
      });
    }
  };

  const groupedPermissions = groupPermissionsByModule(permissions);
  const filteredRoles = roles.filter((role) => {
    const value = query.trim().toLowerCase();
    if (!value) return true;
    return (
      role.name.toLowerCase().includes(value) ||
      role.code.toLowerCase().includes(value) ||
      role.description.toLowerCase().includes(value)
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Shield className="h-6 w-6 text-primary" />
            Role Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define role permissions for your tenant. Editable system roles: teacher, parent, student.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            New Role
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Info className="h-3.5 w-3.5" />
              Access policy
            </div>
            Tenant Admin can manage custom roles and system role permissions for teacher, parent, and student. Other system roles remain read-only.
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles by name, code, description"
              className="pl-9"
            />
          </div>
          {error && (
            <CardDescription className="text-red-600 dark:text-red-400">{error}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full">
            <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
            </thead>
            <tbody>
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No roles match your search.</td>
                </tr>
              ) : (
                filteredRoles.map((role) => {
                  const editable = !role.is_system || canTenantManageSystemRole(role.code);
                  return (
                    <tr key={role.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {role.is_system ? <Lock className="h-4 w-4 text-amber-500" /> : <Unlock className="h-4 w-4 text-emerald-500" />}
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-xs text-muted-foreground">{role.description || 'No description'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-2 py-1 text-xs">{role.code}</code>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={role.is_system ? 'secondary' : 'default'}>
                          {role.is_system ? 'System' : 'Custom'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{(role.permissions || []).length} assigned</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(role)}
                            disabled={!editable}
                            title={editable ? 'Edit role' : 'System role cannot be edited'}
                          >
                            <Edit2 className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          {deleteConfirm === role.id ? (
                            <>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(role.id)}>
                                <Check className="mr-1 h-3.5 w-3.5" />Confirm
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(role.id)}
                              disabled={role.is_system}
                              title={role.is_system ? 'System roles cannot be deleted' : 'Delete role'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {editingRole ? 'Edit Role Interface' : 'Create New Security Role'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto">
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="mb-2 block">Role Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Lab Assistant" required />
                </div>
                <div>
                  <Label className="mb-2 block">Role Code</Label>
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                    placeholder="e.g. lab_assistant"
                    disabled={!!editingRole}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label className="mb-2 block">Description</Label>
                <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Brief description" />
              </div>

              <div>
                <Label className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Capabilities & Matrix
                  </div>
                  <div className="relative w-48">
                    <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Filter permissions..." 
                      className="h-7 pl-7 text-[10px] rounded-lg"
                      value={permSearch}
                      onChange={(e) => setPermSearch(e.target.value)}
                    />
                  </div>
                </Label>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([module, perms]) => {
                    const filtered = perms.filter(p => 
                      p.code.toLowerCase().includes(permSearch.toLowerCase()) || 
                      p.description.toLowerCase().includes(permSearch.toLowerCase())
                    );
                    if (filtered.length === 0) return null;
                    
                    const modulePermCodes = filtered.map(p => p.code);
                    const allSelected = modulePermCodes.every(code => formPermissions.includes(code));

                    return (
                      <div key={module} className="rounded-xl border bg-slate-50/30 p-4 transition-colors hover:border-primary/20">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{module}</h4>
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleModulePermissions(module, filtered)}
                            className="h-6 px-2 text-[9px] font-bold text-primary uppercase"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {filtered.map((perm) => (
                            <label key={perm.code} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all hover:shadow-sm ${formPermissions.includes(perm.code) ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-transparent'}`}>
                              <Switch
                                checked={formPermissions.includes(perm.code)}
                                onCheckedChange={() => togglePermission(perm.code)}
                                className="mt-0.5"
                              />
                              <div>
                                <div className="text-xs font-black text-slate-700">{perm.code}</div>
                                <div className="text-[10px] leading-relaxed text-slate-400 font-medium">{perm.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DialogFooter className="mt-4 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="gap-2">
                  <Save className="h-4 w-4" />
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
