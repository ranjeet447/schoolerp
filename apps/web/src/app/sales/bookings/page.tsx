"use client";

import React, { useEffect, useState } from 'react';
import { BookingTable } from '@schoolerp/ui';
import { apiClient } from '@/lib/api-client';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient('/admin/demo-bookings?limit=100');
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to load demo bookings');
      }
      const data = await res.json();
      setBookings(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error(err);
      setError('Could not load demo bookings. Ensure you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demo Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage leads and upcoming sales demos.</p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading demo bookings...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <BookingTable
            bookings={bookings}
            onAction={(id) => {
              const booking = bookings.find((b) => b.id === id);
              if (!booking?.email) return;
              window.location.href = `mailto:${booking.email}?subject=School ERP Demo Follow-up`;
            }}
          />
        )}
      </div>
    </div>
  );
}
