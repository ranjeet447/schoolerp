"use client";

import React, { useState } from 'react';
import { IntegrationCard } from '@schoolerp/ui';
import { INTEGRATIONS } from './data';

export default function IntegrationsPage() {
  const [category, setCategory] = useState<string>('All');
  const categories = ['All', 'Payments', 'Messaging', 'Transport', 'Accounting', 'Identity', 'Communication'];

  const filtered = category === 'All' 
    ? INTEGRATIONS 
    : INTEGRATIONS.filter(i => i.category === category);

  return (
    <div className="container py-24">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Integrations & Ecosystem</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          School ERP works with the tools you already use. Connect your payment gateway, messaging provider, and accounting software.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(integration => (
          <IntegrationCard key={integration.slug} {...integration} status="active" />
        ))}
      </div>
    </div>
  );
}
