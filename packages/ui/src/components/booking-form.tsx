"use client";

import React, { useState } from 'react';
import { Button } from './button';

interface BookingFormProps {
  onSubmit: (data: any) => Promise<void>;
  status?: 'idle' | 'loading' | 'success';
}

export const BookingForm = ({ onSubmit, status = 'idle' }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school_name: '',
    city: '',
    student_count: '1-500',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Full Name</label>
          <input 
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Work Email</label>
          <input 
            type="email"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">Phone Number</label>
          <input 
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">School Name</label>
          <input 
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
            value={formData.school_name}
            onChange={e => setFormData({...formData, school_name: e.target.value})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Estimated Student Count</label>
        <select 
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={formData.student_count}
          onChange={e => setFormData({...formData, student_count: e.target.value})}
        >
          <option>1-500</option>
          <option>501-1500</option>
          <option>1501-3000</option>
          <option>3000+</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Additional Context (Optional)</label>
        <textarea 
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm" 
          value={formData.message}
          onChange={e => setFormData({...formData, message: e.target.value})}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? 'Confirming Booking...' : 'Schedule Demo'}
      </Button>
    </form>
  );
};
