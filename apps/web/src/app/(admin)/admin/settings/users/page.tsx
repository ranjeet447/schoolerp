"use client"

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Shield, 
  Mail, 
  CheckCircle2, 
  XCircle,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  Button, 
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  SelectValue
} from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient('/admin/roles/users'),
        apiClient('/admin/roles')
      ]);

      if (!usersRes.ok) {
        const msg = await usersRes.text();
        throw new Error(msg || 'Failed to load users');
      }
      if (!rolesRes.ok) {
        const msg = await rolesRes.text();
        throw new Error(msg || 'Failed to load roles');
      }

      setUsers(await usersRes.json());
      setRoles(await rolesRes.json());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
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

  const handleAssignRole = async () => {
    if (!selectedUser || !targetRole) return;

    try {
      setAssigning(true);
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
        setSelectedUser(null);
        setTargetRole('');
        fetchData(true);
      } else {
        const msg = await res.text();
        toast.error(msg || 'Failed to assign role');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Role Assignment</h1>
          <p className="text-sm text-muted-foreground">Assign and review tenant roles for existing users.</p>
        </div>
        <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
              <Info className="h-3.5 w-3.5" />
              Role assignment workflow
            </div>
            Select a user and assign one tenant role. Role enforcement and permission checks happen in backend middleware.
          </div>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {error && <CardDescription className="text-red-600 dark:text-red-400">{error}</CardDescription>}
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">User</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Current Role</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No users match your search.
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                        {user.full_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" /> {user.role_code.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {user.is_active ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                        <XCircle className="h-4 w-4" /> Deactivated
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setTargetRole(roles.find(r => r.code === user.role_code)?.id || '');
                        setShowAssignModal(true);
                      }}
                    >
                      Assign Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              {selectedUser ? `Update role for ${selectedUser.full_name}` : 'Select a user role to assign'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Select Role</Label>
            <Select value={targetRole} onValueChange={setTargetRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
            <Button onClick={handleAssignRole} disabled={assigning || !targetRole}>
              {assigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
