"use client";

import React from "react";
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  Save,
  Info,
  Layers
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge
} from "@schoolerp/ui";

type RbacTemplate = {
  roles: Array<{ role_code: string; role_name: string }>;
  permissions: Array<{ code: string; module: string; description?: string }>;
};

type RbacMatrixProps = {
  rbac: RbacTemplate | null;
  rbacDraft: Record<string, string[]>;
  onToggle: (roleCode: string, permissionCode: string, checked: boolean) => void;
  onSave: (roleCode: string) => Promise<void>;
  busy: boolean;
};

export function RbacMatrix({ rbac, rbacDraft, onToggle, onSave, busy }: RbacMatrixProps) {
  if (!rbac) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight">Access Control Templates</h2>
        <p className="text-sm text-muted-foreground">
          Define global permission sets for platform-level operational roles.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Modifying templates affects all users assigned to the respective role. Permissions are applied globally across the platform scope.
        </p>
      </div>

      <div className="grid gap-8">
        {rbac.roles.map((role) => (
          <Card key={role.role_code} className="overflow-hidden border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{role.role_name}</CardTitle>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{role.role_code}</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => onSave(role.role_code)} 
                disabled={busy}
                className="shadow-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                Commit Changes
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                {rbac.permissions.map((perm) => {
                  const isChecked = (rbacDraft[role.role_code] || []).includes(perm.code);
                  return (
                    <div 
                      key={`${role.role_code}-${perm.code}`}
                      className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/30 ${isChecked ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center pt-0.5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input text-primary ring-offset-background focus:ring-2 focus:ring-primary"
                          checked={isChecked}
                          onChange={(e) => onToggle(role.role_code, perm.code, e.target.checked)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-foreground">{perm.code}</span>
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter opacity-70">
                            {perm.module}
                          </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {perm.description || `Grants access to ${perm.module} operations.`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
