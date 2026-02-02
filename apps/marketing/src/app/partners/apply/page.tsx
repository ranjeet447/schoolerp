"use client";

import React, { useState } from 'react';
import { Button } from '@schoolerp/ui';

export default function PartnerApplyPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-3xl font-bold">Application Received</h1>
        <p className="mt-4 text-muted-foreground">Our partnership team will review your application and reach out within 48 hours.</p>
      </div>
    );
  }

  return (
    <div className="container py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold">Become a Partner</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Join our ecosystem of integrated hardware and software solutions.
        </p>

        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Company Name</label>
              <input required className="w-full rounded-md border bg-background px-3 py-2" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Website URL</label>
              <input required className="w-full rounded-md border bg-background px-3 py-2" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Business Category</label>
            <select className="w-full rounded-md border bg-background px-3 py-2">
              <option>Biometric Hardware</option>
              <option>GPS Tracking</option>
              <option>Financial Services</option>
              <option>LMS Content</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Interest / Notes</label>
            <textarea rows={4} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  );
}
