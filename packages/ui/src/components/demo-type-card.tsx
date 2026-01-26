"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Button } from './button';
import { Clock } from 'lucide-react';

interface DemoTypeCardProps {
  name: string;
  duration: number;
  description: string;
  href: string;
}

export const DemoTypeCard = ({ name, duration, description, href }: DemoTypeCardProps) => {
  return (
    <Card className="flex h-full flex-col transition-all hover:ring-2 hover:ring-primary">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {duration} Minutes
        </div>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col">
        <CardDescription className="flex-grow">
          {description}
        </CardDescription>
        <Button onClick={() => window.location.href = href} className="mt-6 w-full">
          Select Slot
        </Button>
      </CardContent>
    </Card>
  );
};
