"use client"

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Puzzle, RefreshCcw } from 'lucide-react';
import { Button } from '@schoolerp/ui';
import PluginCard from './plugin-card';

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
    reason?: string;
    billing_reference?: string;
    requested_at?: string;
    approved_at?: string;
    activated_at?: string;
    review_notes?: string;
  };
  created_at: string;
};

export default function PluginManagementPage() {
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [requests, setRequests] = useState<AddonActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const [pluginsRes, requestsRes] = await Promise.all([
        apiClient('/admin/tenants/plugins'),
        apiClient('/admin/tenants/addon-requests?limit=100'),
      ]);

      if (pluginsRes.ok) {
        const data = await pluginsRes.json();
        setPlugins(Array.isArray(data?.plugins) ? data.plugins : []);
      } else {
        setPlugins([]);
      }

      if (requestsRes.ok) {
        const requestData = await requestsRes.json();
        setRequests(Array.isArray(requestData?.requests) ? requestData.requests : []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
      setPlugins([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const latestRequestByAddon = requests.reduce<Record<string, AddonActivationRequest>>((acc, req) => {
    const addonID = req?.payload?.addon_id;
    if (!addonID) return acc;
    const existing = acc[addonID];
    if (!existing || new Date(req.created_at).getTime() > new Date(existing.created_at).getTime()) {
      acc[addonID] = req;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
            <Puzzle className="h-3 w-3" />
            <span>Marketplace</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Plugin Management</h1>
          <p className="text-muted-foreground font-medium">Extend your ERP functionality by enabling modular integrations.</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={fetchPlugins} 
          disabled={loading}
          className="border-white/10 text-slate-300 hover:bg-white/5 gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900 animate-pulse border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plugins.map((plugin) => (
            <PluginCard 
              key={plugin.metadata.id} 
              plugin={plugin} 
              latestRequest={latestRequestByAddon[plugin.metadata.id]}
              onRefresh={fetchPlugins} 
            />
          ))}
        </div>
      )}

      {!loading && plugins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 rounded-full bg-slate-900 text-slate-700">
            <Puzzle className="h-12 w-12" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No plugins found</h3>
            <p className="text-slate-500 max-w-xs">Check back later for new integrations and features.</p>
          </div>
        </div>
      )}
    </div>
  );
}
