"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Lock,
  Unlock,
  Users,
  Settings,
  ChevronDown,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Button, Input, Label } from '@schoolerp/ui';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

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

// Group permissions by module
function groupPermissionsByModule(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}
 import { apiClient } from '@/lib/api-client';

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiClient('/admin/roles'),
        apiClient('/admin/permissions'),
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        setRoles(rolesData || []);
      }
      if (permsRes.ok) {
        const permsData = await permsRes.json();
        setPermissions(permsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load roles data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    if (role.is_system) {
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
        fetchData();
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
        fetchData();
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

  const groupedPermissions = groupPermissionsByModule(permissions);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-400" />
            Role Management
          </h1>
          <p className="text-slate-400 mt-1">
            Create custom roles and assign permissions for your school staff
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Roles Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Code</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {role.is_system ? (
                      <Lock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Unlock className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium text-white">{role.name}</div>
                      <div className="text-sm text-slate-400">{role.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="px-2 py-1 bg-slate-900/50 rounded text-sm text-indigo-300">{role.code}</code>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    role.is_system 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  }`}>
                    {role.is_system ? 'System' : 'Custom'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {(role.permissions || []).slice(0, 3).map((perm) => (
                      <span key={perm} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                    {(role.permissions || []).length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-600/50 text-slate-300 rounded text-xs">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(role)}
                      disabled={role.is_system}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={role.is_system ? 'System roles cannot be edited' : 'Edit role'}
                    >
                      <Edit2 className="h-4 w-4 text-slate-400" />
                    </button>
                    {deleteConfirm === role.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                        >
                          <Check className="h-4 w-4 text-red-400" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(role.id)}
                        disabled={role.is_system}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={role.is_system ? 'System roles cannot be deleted' : 'Delete role'}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-700/50 rounded-lg">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Role Name</Label>
                      <Input
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Lab Assistant"
                        className="bg-slate-900/50 border-slate-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-2 block">Role Code</Label>
                      <Input
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        placeholder="e.g. lab_assistant"
                        className="bg-slate-900/50 border-slate-600 text-white"
                        disabled={!!editingRole}
                        required
                      />
                      {editingRole && (
                        <p className="text-xs text-slate-500 mt-1">Code cannot be changed</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-2 block">Description</Label>
                    <Input
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief description of this role..."
                      className="bg-slate-900/50 border-slate-600 text-white"
                    />
                  </div>
                </div>

                {/* Permission Picker */}
                <div>
                  <Label className="text-slate-300 mb-3 block flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Permissions
                  </Label>
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([module, perms]) => (
                      <div key={module} className="bg-slate-900/30 rounded-lg p-4">
                        <h4 className="font-medium text-indigo-300 mb-3 uppercase text-sm tracking-wide">{module}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {perms.map((perm) => (
                            <label
                              key={perm.code}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                formPermissions.includes(perm.code)
                                  ? 'bg-indigo-500/20 border border-indigo-500/30'
                                  : 'hover:bg-slate-700/30 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formPermissions.includes(perm.code)}
                                onChange={() => togglePermission(perm.code)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                formPermissions.includes(perm.code)
                                  ? 'bg-indigo-500 border-indigo-500'
                                  : 'border-slate-500'
                              }`}>
                                {formPermissions.includes(perm.code) && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm text-white">{perm.code}</div>
                                <div className="text-xs text-slate-400">{perm.description}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>

              <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  className="bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
