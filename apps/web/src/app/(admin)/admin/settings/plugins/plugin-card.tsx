"use client"

import React, { useState } from 'react';
import { Card, Switch, Button, Badge } from '@schoolerp/ui';
import { Settings, Puzzle, CreditCard, MessageSquare, BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import PluginConfigDialog from './plugin-config-dialog';

interface PluginCardProps {
  plugin: any;
  onRefresh: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Finance': CreditCard,
  'Communication': MessageSquare,
  'Marketing': BarChart3,
};

export default function PluginCard({ plugin, onRefresh }: PluginCardProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const Icon = CATEGORY_ICONS[plugin.metadata.category] || Puzzle;

  const handleToggle = async (enabled: boolean) => {
    setToggleLoading(true);
    try {
      const res = await apiClient(`/admin/tenants/plugins/${plugin.metadata.id}`, {
        method: 'POST',
        body: JSON.stringify({
          enabled,
          settings: plugin.settings,
        }),
      });

      if (res.ok) {
        toast.success(`${plugin.metadata.name} ${enabled ? 'enabled' : 'disabled'}.`);
        onRefresh();
      } else {
        toast.error('Failed to update plugin status.');
      }
    } catch (error) {
      console.error('Plugin toggle error:', error);
      toast.error('An error occurred.');
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 bg-slate-900/50 border-white/5 backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6" />
          </div>
          <Switch 
            checked={plugin.enabled}
            onCheckedChange={handleToggle}
            disabled={toggleLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{plugin.metadata.name}</h3>
            {plugin.enabled && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] uppercase font-bold">
                Active
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {plugin.metadata.description}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">
            {plugin.metadata.category}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsConfigOpen(true)}
            className="text-slate-400 hover:text-white hover:bg-white/5 gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </Card>

      <PluginConfigDialog 
        plugin={plugin}
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}
