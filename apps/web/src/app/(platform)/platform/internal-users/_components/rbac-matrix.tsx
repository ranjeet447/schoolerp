"use client";

import React, { useState, useMemo } from "react";
import { 
  Shield, 
  Search,
  CheckCircle2, 
  Save,
  Info,
  ChevronRight,
  Filter,
  CheckSquare,
  MinusSquare,
  Package
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Input,
  Checkbox,
  Separator
} from "@schoolerp/ui";
import { useDebouncedValue } from "@/lib/use-debounced-value";

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
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  const groupedPermissions = useMemo(() => {
    if (!rbac) return {};
    
    const filtered = rbac.permissions.filter(p => 
      p.code.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      p.module.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    return filtered.reduce((acc, curr) => {
      if (!acc[curr.module]) acc[curr.module] = [];
      acc[curr.module].push(curr);
      return acc;
    }, {} as Record<string, RbacTemplate["permissions"]>);
  }, [rbac, debouncedSearchQuery]);

  if (!rbac) return null;

  const modules = Object.keys(groupedPermissions).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-foreground">Access Control Templates</h2>
          <p className="text-sm font-medium text-muted-foreground">
            Define global permission sets for platform-level operational roles.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search permissions..." 
            className="pl-9 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 backdrop-blur-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <p className="text-[13px] font-medium leading-relaxed text-blue-800 dark:text-blue-300">
          Modifying templates affects all users assigned to the respective role. Permissions are applied globally across the platform scope. Changes require a explicit commit to take effect.
        </p>
      </div>

      <div className="grid gap-8">
        {rbac.roles.map((role) => (
          <Card key={role.role_code} className="overflow-hidden border-border/50 shadow-sm ring-1 ring-border/5">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/40 py-4 px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold tracking-tight">{role.role_name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase tracking-widest">{role.role_code}</code>
                    <Badge variant="outline" className="text-[9px] h-4 font-bold border-primary/20 bg-primary/5 text-primary">TEMPLATE</Badge>
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => onSave(role.role_code)} 
                disabled={busy}
                className="shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                <Save className="mr-2 h-4 w-4" />
                Commit Changes
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                {modules.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground italic text-sm">
                    No permissions found matching your search.
                  </div>
                ) : (
                  modules.map((moduleName, mIdx) => {
                    const modulePerms = groupedPermissions[moduleName];
                    const selectedInModule = modulePerms.filter(p => (rbacDraft[role.role_code] || []).includes(p.code));
                    const isAllSelected = selectedInModule.length === modulePerms.length;
                    const isAnySelected = selectedInModule.length > 0;

                    return (
                      <div key={moduleName} className="border-b last:border-0">
                        <div className="flex items-center justify-between bg-muted/20 px-6 py-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground/80">{moduleName}</h3>
                            <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px] rounded-full">{modulePerms.length}</Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-[10px] font-bold uppercase tracking-tight hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              const newValue = !isAllSelected;
                              modulePerms.forEach(p => onToggle(role.role_code, p.code, newValue));
                            }}
                          >
                            {isAllSelected ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3">
                          {modulePerms.map((perm) => {
                            const isChecked = (rbacDraft[role.role_code] || []).includes(perm.code);
                            return (
                              <div 
                                key={`${role.role_code}-${perm.code}`}
                                className={`group flex items-start gap-4 p-5 transition-all hover:bg-primary/5 border-r border-b last:border-b-0 md:border-b-0 cursor-pointer ${isChecked ? 'bg-primary/[0.02]' : ''}`}
                                onClick={() => onToggle(role.role_code, perm.code, !isChecked)}
                              >
                                <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={(checked) => onToggle(role.role_code, perm.code, !!checked)}
                                  />
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[11px] font-black font-mono transition-colors ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                                      {perm.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 md:line-clamp-none group-hover:text-foreground/70 transition-colors">
                                    {perm.description || `Grants access to ${perm.module} operations.`}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
