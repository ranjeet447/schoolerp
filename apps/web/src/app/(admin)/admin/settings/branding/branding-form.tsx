"use client"

import React, { useState } from 'react';
import { TenantConfig } from '@/lib/tenant-utils';
import { Button, Input, Label, Switch, Card } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Save, Palette, Type, Image as ImageIcon, ShieldCheck } from 'lucide-react';

interface BrandingFormProps {
  initialConfig: TenantConfig | null;
}

export default function BrandingForm({ initialConfig }: BrandingFormProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<TenantConfig>({
    name: initialConfig?.name || '',
    white_label: initialConfig?.white_label || false,
    branding: {
      primary_color: initialConfig?.branding?.primary_color || '#4f46e5',
      name_override: initialConfig?.branding?.name_override || '',
      logo_url: initialConfig?.branding?.logo_url || '',
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await apiClient('/admin/tenants/config', {
        method: 'POST',
        body: JSON.stringify({ config }),
      });

      if (res.ok) {
        toast.success('Branding settings updated successfully! Please refresh to see changes.');
        // Optionally refresh the page to update layout
        // window.location.reload();
      } else {
        toast.error('Failed to update branding settings.');
      }
    } catch (error) {
      console.error('Branding update error:', error);
      toast.error('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6 bg-slate-900/50 border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white">Visual Identity</h2>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="school-name" className="text-slate-300">School Name (Display)</Label>
            <div className="relative group">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400" />
              <Input 
                id="school-name"
                value={config.branding.name_override || config.name}
                onChange={(e) => setConfig({
                  ...config,
                  branding: { ...config.branding, name_override: e.target.value }
                })}
                className="pl-10 bg-slate-800/50 border-white/10 text-white"
                placeholder="Enter displayed school name"
              />
            </div>
            <p className="text-xs text-slate-500 italic">This overrides the legal tenant name in the UI.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="primary-color" className="text-slate-300">Primary Branding Color</Label>
            <div className="flex items-center gap-4">
              <Input 
                type="color" 
                id="primary-color"
                value={config.branding.primary_color}
                onChange={(e) => setConfig({
                  ...config,
                  branding: { ...config.branding, primary_color: e.target.value }
                })}
                className="h-10 w-20 bg-transparent border-none cursor-pointer"
              />
              <Input 
                value={config.branding.primary_color}
                onChange={(e) => setConfig({
                  ...config,
                  branding: { ...config.branding, primary_color: e.target.value }
                })}
                className="flex-1 bg-slate-800/50 border-white/10 text-white font-mono"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logo-url" className="text-slate-300">Logo URL</Label>
            <div className="relative group">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400" />
              <Input 
                id="logo-url"
                value={config.branding.logo_url}
                onChange={(e) => setConfig({
                  ...config,
                  branding: { ...config.branding, logo_url: e.target.value }
                })}
                className="pl-10 bg-slate-800/50 border-white/10 text-white"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-900/50 border-white/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-xl font-bold text-white">White-Labeling</h2>
              <p className="text-sm text-slate-400">Remove SchoolERP branding from all portals.</p>
            </div>
          </div>
          <Switch 
            checked={config.white_label}
            onCheckedChange={(checked) => setConfig({ ...config, white_label: checked })}
          />
        </div>
      </Card>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          {loading ? 'Saving...' : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Branding Settings
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
