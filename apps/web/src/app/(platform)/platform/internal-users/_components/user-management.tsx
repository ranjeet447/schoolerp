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
  Clock
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
  "super_admin",
  "support_l1",
  "support_l2",
  "finance",
  "ops",
  "developer",
];

export function UserManagement({ 
  users, 
  onReload, 
  onUpdate, 
  onCreate, 
  onRotateTokens, 
  onRevokeSessions,
  busy 
}: UserManagementProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "",
    role_code: "support_l1",
  });

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
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. John Doe" 
                    className="pl-9"
                    value={newUser.full_name}
                    onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="work@company.com" 
                    className="pl-9"
                    value={newUser.email}
                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Security Role</label>
                <Select 
                  value={newUser.role_code}
                  onValueChange={v => setNewUser({...newUser, role_code: v})}
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role.replace("_", " ")}</option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleCreate} disabled={busy}>
                  Invite Member
                </Button>
              </div>
            </div>
            <div className="mt-3">
               <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Temporary Password</label>
               <Input 
                 type="password" 
                 placeholder="Strong temporary password" 
                 value={newUser.password}
                 onChange={e => setNewUser({...newUser, password: e.target.value})}
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
                          {u.full_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{u.full_name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {u.role_code.replace("_", " ")}
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
                            <span>Rotate Credentials</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">
                            Security Sessions
                          </div>
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
    </div>
  );
}
