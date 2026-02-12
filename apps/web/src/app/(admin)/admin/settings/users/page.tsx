"use client"

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  Mail, 
  CheckCircle2, 
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Label 
} from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface UserRole {
  id: string;
  email: string;
  full_name: string;
  role_code: string;
  is_active: boolean;
}

interface Role {
  id: string;
  name: string;
  code: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetRole, setTargetRole] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient('/admin/roles/users'),
        apiClient('/admin/roles')
      ]);

      if (usersRes.ok) {
        setUsers(await usersRes.json());
      }
      if (rolesRes.ok) {
        setRoles(await rolesRes.json());
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignRole = async () => {
    if (!selectedUser || !targetRole) return;

    try {
      const res = await apiClient('/admin/roles/assign', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedUser.id,
          role_id: targetRole
        })
      });

      if (res.ok) {
        toast.success(`Role assigned to ${selectedUser.full_name}`);
        setShowAssignModal(false);
        fetchData();
      } else {
        toast.error('Failed to assign role');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-slate-400">Manage staff accounts and assign roles.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2">
          <UserPlus className="h-4 w-4" /> Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
          </div>
          <div className="text-4xl font-black text-white">{users.length}</div>
        </div>
        
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Accounts</span>
          </div>
          <div className="text-4xl font-black text-white">{users.filter(u => u.is_active).length}</div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Custom Roles</span>
          </div>
          <div className="text-4xl font-black text-white">{roles.length}</div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-11 bg-slate-800/50 border-white/5 focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={fetchData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Personnel Data...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="h-16 w-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-slate-600" />
                    </div>
                    <p className="text-white font-black text-lg">No users found</p>
                    <p className="text-slate-500">Try adjusting your search filters.</p>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
                        {user.full_name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{user.full_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Shield className="h-3 w-3" /> {user.role_code.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-500 text-xs font-bold">
                        <XCircle className="h-4 w-4" /> Deactivated
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    Today, 10:45 AM
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-500 hover:text-white"
                      onClick={() => {
                        setSelectedUser(user);
                        setTargetRole(roles.find(r => r.code === user.role_code)?.id || '');
                        setShowAssignModal(true);
                      }}
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Role Modal */}
      <AnimatePresence>
        {showAssignModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              
              <h2 className="text-2xl font-black text-white mb-2">Assign Role</h2>
              <p className="text-slate-400 mb-8">Update {selectedUser.full_name}'s access level.</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Select Role</Label>
                  <select 
                    className="w-full h-12 bg-slate-800 border border-white/10 rounded-xl px-4 text-white font-bold appearance-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  >
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-xl text-slate-400 hover:text-white"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                    onClick={handleAssignRole}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
