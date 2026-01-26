import React from 'react';
import { Badge } from './badge';
import { Button } from './button';

interface Booking {
  id: string;
  name: string;
  email: string;
  school_name: string;
  start_at: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
}

interface BookingTableProps {
  bookings: Booking[];
  onAction: (id: string, action: string) => void;
}

export const BookingTable = ({ bookings, onAction }: BookingTableProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact / School</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Scheduled Time</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                <div className="text-xs text-gray-500">{booking.school_name}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="text-sm text-gray-900">
                  {new Date(booking.start_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Button variant="ghost" size="sm" onClick={() => onAction(booking.id, 'view')}>
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
