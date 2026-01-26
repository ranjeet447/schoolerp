"use client";

import React from 'react';
import { Button } from './button';
import { Card, CardHeader, CardTitle, CardContent } from './card';

interface Rule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface AvailabilityRuleEditorProps {
  rules: Rule[];
  onSave: (rules: Rule[]) => Promise<void>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AvailabilityRuleEditor = ({ rules, onSave }: AvailabilityRuleEditorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day, idx) => {
          const rule = rules.find(r => r.day_of_week === idx);
          return (
            <div key={day} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="w-32 font-medium">{day}</div>
              <div className="flex items-center gap-4">
                <input 
                  type="time" 
                  className="rounded-md border px-2 py-1 text-sm"
                  defaultValue={rule?.start_time || '09:00'}
                />
                <span className="text-muted-foreground">to</span>
                <input 
                  type="time" 
                  className="rounded-md border px-2 py-1 text-sm"
                  defaultValue={rule?.end_time || '17:00'}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  defaultChecked={rule?.is_active ?? true}
                  className="h-4 w-4 rounded border-gray-300" 
                />
                <span className="text-sm">Available</span>
              </div>
            </div>
          );
        })}
        <Button className="mt-6 w-full" onClick={() => onSave(rules)}>
          Save Schedule
        </Button>
      </CardContent>
    </Card>
  );
};
