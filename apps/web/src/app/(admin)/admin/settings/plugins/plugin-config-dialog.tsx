"use client"

import React, { useEffect, useState } from 'react';
import { Button, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Textarea } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

type PluginItem = {
  metadata: {
    id: string;
    name: string;
    description?: string;
    config_schema?: Record<string, string>;
  };
  enabled: boolean;
  settings?: Record<string, unknown>;
};

type AddonActivationRequest = {
  id: string;
  status: string;
  payload?: {
    review_notes?: string;
  };
};

interface PluginConfigDialogProps {
  plugin: PluginItem;
  latestRequest?: AddonActivationRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function PluginConfigDialog({ plugin, latestRequest, open, onOpenChange, onSuccess }: PluginConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, unknown>>(plugin.settings || {});
  const [reason, setReason] = useState('');
  const requestStatus = (latestRequest?.status || '').toLowerCase();
  const isRequestMode = !plugin.enabled;
  const requestLocked = requestStatus === 'pending' || requestStatus === 'approved';

  useEffect(() => {
    setSettings(plugin.settings || {});
    setReason('');
  }, [plugin, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isRequestMode) {
        const res = await apiClient('/admin/tenants/addon-requests', {
          method: 'POST',
          body: JSON.stringify({
            addon_id: plugin.metadata.id,
            reason: reason.trim(),
            settings,
          }),
        });

        if (res.ok) {
          toast.success(`Activation request sent for ${plugin.metadata.name}.`);
          onSuccess();
          onOpenChange(false);
        } else {
          const text = await res.text();
          toast.error(text || 'Failed to submit activation request.');
        }
      } else {
        const res = await apiClient(`/admin/tenants/plugins/${plugin.metadata.id}`, {
          method: 'POST',
          body: JSON.stringify({
            enabled: true,
            settings,
          }),
        });

        if (res.ok) {
          toast.success(`${plugin.metadata.name} configuration saved.`);
          onSuccess();
          onOpenChange(false);
        } else {
          const text = await res.text();
          toast.error(text || 'Failed to save configuration.');
        }
      }
    } catch (error) {
      console.error('Plugin dialog save error:', error);
      toast.error('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{plugin.metadata.name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {isRequestMode
              ? 'Review add-on details and submit an activation request. Platform admin will activate after billing confirmation.'
              : 'Configure the settings for this active add-on.'}
          </DialogDescription>
        </DialogHeader>

        {requestLocked ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
            Activation request is already in {requestStatus} state.
            {latestRequest?.payload?.review_notes ? ` Note: ${latestRequest.payload.review_notes}` : ''}
          </div>
        ) : null}

        <div className="grid gap-4 py-2">
          {Object.entries(plugin.metadata.config_schema || {}).map(([key, type]) => {
            const inputType = String(type || 'text').toLowerCase();
            const value = settings[key];
            if (inputType === 'boolean') {
              return (
                <div key={key} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                  <Label htmlFor={key} className="capitalize text-slate-300">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <input
                    id={key}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-slate-800"
                    disabled={loading || requestLocked}
                  />
                </div>
              );
            }
            return (
              <div key={key} className="grid gap-2">
                <Label htmlFor={key} className="capitalize text-slate-300">
                  {key.replace(/_/g, ' ')}
                </Label>
                <Input
                  id={key}
                  type={inputType === 'number' ? 'number' : inputType === 'password' ? 'password' : 'text'}
                  value={value == null ? '' : String(value)}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [key]: inputType === 'number' ? Number(e.target.value || 0) : e.target.value,
                    })
                  }
                  className="bg-slate-800/50 border-white/10 text-white"
                  disabled={loading || requestLocked}
                />
              </div>
            );
          })}

          {isRequestMode ? (
            <div className="grid gap-2">
              <Label htmlFor="request-reason" className="text-slate-300">
                Request note (optional)
              </Label>
              <Textarea
                id="request-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Example: Need this add-on for upcoming term billing workflows."
                className="bg-slate-800/50 border-white/10 text-white"
                rows={3}
                disabled={loading || requestLocked}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={loading || requestLocked}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
          >
            {loading ? 'Submitting...' : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isRequestMode ? 'Submit Activation Request' : 'Save Settings'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

