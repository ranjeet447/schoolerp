"use client";

import React from 'react';
import { BookingTable } from '@schoolerp/ui';

export default function AdminBookingsPage() {
  const mockBookings: any[] = [
    { id: '1', name: 'Vivek Sharma', email: 'vivek@dps.edu.in', school_name: 'Delhi Public School', start_at: '2026-02-01T10:00:00Z', status: 'confirmed' },
    { id: '2', name: 'Anita Rao', email: 'anita@kv.ac.in', school_name: 'Kendriya Vidyalaya', start_at: '2026-02-02T14:30:00Z', status: 'pending' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Demo Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage leads and upcoming sales demos.</p>
        </div>
      </div>

      <div className="mt-8">
        <BookingTable 
          bookings={mockBookings} 
          onAction={(id, action) => alert(`Action: ${action} on booking ${id}`)} 
        />
      </div>
    </div>
  );
}
