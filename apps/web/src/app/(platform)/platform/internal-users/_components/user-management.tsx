"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Activity,
  MoreVertical,
  Ban,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Mail,
  User as UserIcon,
  Clock,
  Key,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
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
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@schoolerp/ui";
import { format } from "date-fns";

type PlatformInternalUser = {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role_code: string;
  role_name: string;
  last_login?: string;
  active_sessions: number;
  created_at: string;
  updated_at: string;
};

type UserManagementProps = {
  users: PlatformInternalUser[];
  onReload: () => void;
  onUpdate: (userId: string, payload: any, label: string) => Promise<void>;
  onCreate: (userData: any) => Promise<void>;
  onRotateTokens: (userId: string) => Promise<void>;
  onRevokeSessions: (userId: string) => Promise<void>;
  busy: boolean;
};

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "support_l1", label: "Support L1" },
  { value: "support_l2", label: "Support L2" },
  { value: "finance", label: "Finance" },
  { value: "ops", label: "Operations" },
  { value: "developer", label: "Developer" },
];

export function UserManagement({
  users,
  onReload,
  onUpdate,
  onCreate,
  onRotateTokens,
  onRevokeSessions,
  busy,
}: UserManagementProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    role_code: "support_l1",
  });

  // Role change dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<PlatformInternalUser | null>(null);
  const [newRoleCode, setNewRoleCode] = useState("");

  // Password reset dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<PlatformInternalUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleCreate = async () => {
    await onCreate(newUser);
    setNewUser({
      email: "",
      full_name: "",
      password: "",
      role_code: "support_l1",
    });
    setShowAddUser(false);
  };

  const handleRoleChange = async () => {
    if (!selectedUserForRole || !newRoleCode) return;
    await onUpdate(selectedUserForRole.id, { role_code: newRoleCode }, "Role updated.");
    setRoleDialogOpen(false);
    setSelectedUserForRole(null);
  };

  const handlePasswordReset = async () => {
    if (!selectedUserForPassword || newPassword.length < 8) return;
    await onUpdate(selectedUserForPassword.id, { password: newPassword }, "Password reset.");
    setPasswordDialogOpen(false);
    setSelectedUserForPassword(null);
    setNewPassword("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Internal Personnel</h2>
          <p className="text-sm font-medium text-muted-foreground">
            Manage administrative access for the platform maintenance team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 font-bold h-10 border-border shadow-sm" onClick={onReload} disabled={busy}>
            <RotateCcw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
            <span>Sync Directory</span>
          </Button>
          <Button className="gap-2 font-black shadow-lg shadow-primary/20 h-10" onClick={() => setShowAddUser(!showAddUser)}>
            <UserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </Button>
        </div>
      </div>

      {showAddUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Invite New Platform Administrator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. John Doe"
                    className="pl-9"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="work@company.com"
                    className="pl-9"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Security Role</Label>
                <Select
                  value={newUser.role_code}
                  onValueChange={(v) => setNewUser({ ...newUser, role_code: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleCreate} disabled={busy}>
                  Invite Member
                </Button>
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Temporary Password</Label>
              <Input
                type="password"
                placeholder="Strong temporary password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Active Sessions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    No internal users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-mono text-xs text-muted-foreground">
                          {(u.full_name || "?")[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {(u.role_code || "").replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {u.is_active ? (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-medium text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span className="text-xs font-medium text-rose-600">Locked</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 opacity-70" />
                        {u.last_login ? format(new Date(u.last_login), "MMM d, HH:mm") : "Never"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="px-1.5 py-0 font-mono text-[10px]">
                        {u.active_sessions} Sessions
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                            Identity Control
                          </div>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUserForRole(u);
                              setNewRoleCode(u.role_code);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />
                            <span>Change Role</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onUpdate(u.id, { is_active: !u.is_active }, u.is_active ? "Account disabled." : "Account enabled.")}
                          >
                            {u.is_active ? (
                              <><Ban className="mr-2 h-4 w-4 text-rose-500" /> <span>Disable Account</span></>
                            ) : (
                              <><CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> <span>Restore Account</span></>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRotateTokens(u.id)}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            <span>Force Re-Login</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                            Security
                          </div>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUserForPassword(u);
                              setNewPassword("");
                              setPasswordDialogOpen(true);
                            }}
                          >
                            <Key className="mr-2 h-4 w-4 text-amber-500" />
                            <span>Reset Password</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600"
                            onClick={() => onRevokeSessions(u.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Revoke All Sessions</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the platform role for{" "}
              <span className="font-semibold">{selectedUserForRole?.full_name}</span>.
              This affects their permissions across all platform features.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Role</Label>
              <Badge variant="outline" className="w-fit capitalize">
                {(selectedUserForRole?.role_code || "").replace(/_/g, " ")}
              </Badge>
            </div>
            <div className="grid gap-2">
              <Label>New Role</Label>
              <Select value={newRoleCode} onValueChange={setNewRoleCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={!newRoleCode || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for{" "}
              <span className="font-semibold">{selectedUserForPassword?.full_name}</span>.
              This will invalidate their existing sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-internal-password">New Password</Label>
              <Input
                id="new-internal-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePasswordReset}
              disabled={newPassword.length < 8 || busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
