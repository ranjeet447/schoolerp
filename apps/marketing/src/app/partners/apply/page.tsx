"use client";

import React, { useState } from 'react';
import { Button } from '@schoolerp/ui';

export default function PartnerApplyPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    category: 'Biometric Hardware',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';
      const res = await fetch(`${apiBase}/public/partner-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Unable to submit partner application');
      }

      setStatus('success');
      setFormData({
        company_name: '',
        name: '',
        email: '',
        phone: '',
        website: '',
        category: 'Biometric Hardware',
        description: '',
      });
    } catch (err) {
      console.warn('Partner application failed', err);
      setStatus('error');
      setError('Could not submit application right now. Please try again.');
    }
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Company Name</label>
              <input
                required
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Contact Name</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Contact Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Contact Phone</label>
              <input
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Website URL</label>
              <input
                required
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Business Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option>Biometric Hardware</option>
              <option>GPS Tracking</option>
              <option>Financial Services</option>
              <option>LMS Content</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Interest / Notes</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Submitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  );
}
