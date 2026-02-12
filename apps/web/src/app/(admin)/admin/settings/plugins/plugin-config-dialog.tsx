"use client"

import React, { useState } from 'react';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface PluginConfigDialogProps {
  plugin: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PluginConfigDialog({ plugin, open, onOpenChange, onSuccess }: PluginConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(plugin.settings || {});

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/tenants/plugins/${plugin.metadata.id}`, {
        method: 'POST',
        body: JSON.stringify({
          enabled: plugin.enabled,
          settings: settings,
        }),
      });

      if (res.ok) {
        toast.success(`${plugin.metadata.name} configuration saved!`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Failed to save configuration.');
      }
    } catch (error) {
      console.error('Plugin config save error:', error);
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{plugin.metadata.name} Configuration</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure the settings for this module.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {Object.entries(plugin.metadata.config_schema || {}).map(([key, type]) => (
            <div key={key} className="grid gap-2">
              <Label htmlFor={key} className="capitalize text-slate-300">
                {key.replace(/_/g, ' ')}
              </Label>
              <Input
                id={key}
                type={type as string}
                value={settings[key] || ''}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
          >
            {loading ? 'Saving...' : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
