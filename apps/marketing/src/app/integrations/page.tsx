"use client";

import React, { useState } from 'react';
import { IntegrationCard } from '@schoolerp/ui';

const INTEGRATIONS = [
  { name: 'Razorpay', category: 'Payments', description: 'Universal payments for Indian schools.', status: 'active', slug: 'razorpay' },
  { name: 'WhatsApp Business', category: 'Messaging', description: 'Direct parent communication via WhatsApp.', status: 'active', slug: 'whatsapp' },
  { name: 'Traccar GPS', category: 'Transport', description: 'Real-time school bus tracking integration.', status: 'active', slug: 'traccar' },
  { name: 'Tally Prime', category: 'Accounting', description: 'One-click financial accounting sync.', status: 'coming_soon', slug: 'tally' },
] as const;

export default function IntegrationsPage() {
  const [category, setCategory] = useState<string>('All');
  const categories = ['All', 'Payments', 'Messaging', 'Transport', 'Accounting'];

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
          <IntegrationCard key={integration.slug} {...integration} />
        ))}
      </div>
    </div>
  );
}
