import React from 'react';
import { getTenantConfig } from '@/lib/tenant-utils';
import BrandingForm from './branding-form';
import { Palette } from 'lucide-react';

export default async function BrandingSettingsPage() {
  const config = await getTenantConfig();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
          <Palette className="h-3 w-3" />
          <span>System Settings</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">School Branding</h1>
        <p className="text-slate-400 font-medium">Customize how your school looks across all user portals.</p>
      </div>

      <BrandingForm initialConfig={config} />
    </div>
  );
}
