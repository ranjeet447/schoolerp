"use client";

import React, { useState } from 'react';
import { SlotPicker, BookingForm } from '@schoolerp/ui';

export default function BookingDetailsPage({ params }: { params: { slug: string } }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Stub data
  const slots = [
    '2026-02-01T10:00:00Z', '2026-02-01T11:00:00Z', 
    '2026-02-02T14:00:00Z', '2026-02-02T15:00:00Z'
  ];

  const handleBooking = async (data: any) => {
    setStatus('loading');
    const payload = { ...data, slot: selectedSlot, demo_type: params.slug };
    console.log('Final Booking:', payload);
    
    // API Call: POST /api/public/demo-bookings
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.location.href = '/book-demo/success';
  };

  return (
    <div className="container py-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">
          {step === 1 ? 'Choose a time slot' : 'Enter your details'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {step === 1 
            ? 'Select a time that works for you. All times are in Asia/Kolkata.' 
            : `Booking for ${new Date(selectedSlot!).toLocaleString()}`
          }
        </p>

        <div className="mt-12">
          {step === 1 ? (
            <div className="space-y-8">
              <SlotPicker 
                availableSlots={slots} 
                onSelect={setSelectedSlot} 
                selectedSlot={selectedSlot || undefined} 
              />
              <button 
                disabled={!selectedSlot}
                onClick={() => setStep(2)}
                className="w-full rounded-md bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => setStep(1)} className="text-sm font-medium text-primary">← Change Time</button>
              <BookingForm onSubmit={handleBooking} status={status} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
