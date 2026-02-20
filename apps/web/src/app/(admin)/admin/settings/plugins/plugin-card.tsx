"use client"

import React, { useState } from 'react';
import { Card, Button, Badge } from '@schoolerp/ui';
import { Settings, Puzzle, CreditCard, MessageSquare, BarChart3 } from 'lucide-react';
import PluginConfigDialog from './plugin-config-dialog';

type PluginItem = {
  metadata: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    config_schema?: Record<string, string>;
  };
  enabled: boolean;
  settings?: Record<string, unknown>;
};

type AddonActivationRequest = {
  id: string;
  status: string;
  payload: {
    addon_id: string;
    activated_at?: string;
    approved_at?: string;
    review_notes?: string;
  };
  created_at: string;
};

interface PluginCardProps {
  plugin: PluginItem;
  latestRequest?: AddonActivationRequest;
  onRefresh: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Finance': CreditCard,
  'Communication': MessageSquare,
  'Marketing': BarChart3,
};

export default function PluginCard({ plugin, latestRequest, onRefresh }: PluginCardProps) {
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const Icon = CATEGORY_ICONS[plugin.metadata.category] || Puzzle;
  const requestStatus = (latestRequest?.status || '').toLowerCase();
  const pendingOrApproved = requestStatus === 'pending' || requestStatus === 'approved';
  const activatedByRequest = Boolean(latestRequest?.payload?.activated_at);

  return (
    <>
      <Card className="p-6 bg-slate-900/50 border-white/5 backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6" />
          </div>
          {plugin.enabled ? (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] uppercase font-bold">
              Active
            </Badge>
          ) : requestStatus === 'pending' ? (
            <Badge className="bg-amber-500/10 text-amber-400 border-none text-[10px] uppercase font-bold">
              Requested
            </Badge>
          ) : requestStatus === 'approved' && !activatedByRequest ? (
            <Badge className="bg-blue-500/10 text-blue-400 border-none text-[10px] uppercase font-bold">
              Awaiting Activation
            </Badge>
          ) : requestStatus === 'rejected' ? (
            <Badge className="bg-red-500/10 text-red-400 border-none text-[10px] uppercase font-bold">
              Rejected
            </Badge>
          ) : (
            <Badge className="bg-slate-700/60 text-slate-200 border-none text-[10px] uppercase font-bold">
              Available
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{plugin.metadata.name}</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            {plugin.metadata.description}
          </p>
          {!plugin.enabled && latestRequest?.payload?.review_notes ? (
            <p className="text-xs text-slate-300 rounded-md bg-white/5 px-2 py-1">
              Last review: {latestRequest.payload.review_notes}
            </p>
          ) : null}
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
            disabled={!plugin.enabled && pendingOrApproved}
          >
            <Settings className="h-4 w-4" />
            {plugin.enabled ? 'Configure' : pendingOrApproved ? 'Requested' : 'Request Activation'}
          </Button>
        </div>
      </Card>

      <PluginConfigDialog 
        plugin={plugin}
        latestRequest={latestRequest}
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        onSuccess={onRefresh}
      />
    </>
  );
}
