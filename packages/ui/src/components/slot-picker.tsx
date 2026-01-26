"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SlotPickerProps {
  availableSlots: string[]; // ISO strings
  onSelect: (slot: string) => void;
  selectedSlot?: string;
  timezone?: string;
}

export const SlotPicker = ({ availableSlots, onSelect, selectedSlot, timezone = 'Asia/Kolkata' }: SlotPickerProps) => {
  // Simple view: group by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const date = slot.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(slot);
    return acc;
  }, {} as Record<string, string[]>);

  const dates = Object.keys(slotsByDate).sort();
  const [currentDateIdx, setCurrentDateIdx] = useState(0);
  const currentDate = dates[currentDateIdx];

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  if (dates.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">No slots available for the selected range.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="icon" 
          disabled={currentDateIdx === 0}
          onClick={() => setCurrentDateIdx(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-bold">{formatDate(currentDate)}</h3>
          <p className="text-xs text-muted-foreground">{timezone}</p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          disabled={currentDateIdx === dates.length - 1}
          onClick={() => setCurrentDateIdx(prev => prev + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slotsByDate[currentDate]?.map((slot) => (
          <Button
            key={slot}
            variant={selectedSlot === slot ? 'default' : 'outline'}
            className="text-xs"
            onClick={() => onSelect(slot)}
          >
            {formatTime(slot)}
          </Button>
        ))}
      </div>
    </div>
  );
};
