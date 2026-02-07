"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card'; // Assuming shadcn cards
import { Badge } from './badge';
import { Button } from './button';
import { ExternalLink } from 'lucide-react';

interface IntegrationCardProps {
  name: string;
  category: string;
  description: string;
  logoUrl?: string;
  status?: 'active' | 'beta' | 'planned';
  slug: string;
}

export const IntegrationCard = ({ 
  name, 
  category, 
  description, 
  logoUrl, 
  status,
  slug 
}: IntegrationCardProps) => {
  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted/50 p-2">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="h-full w-full object-contain" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-primary/20" />
            )}
          </div>
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <Badge variant="outline" className="mt-1 font-normal uppercase tracking-wider text-[10px]">
              {category}
            </Badge>
          </div>
        </div>
        {status && (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
            Available
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-grow flex-col">
        <CardDescription className="line-clamp-3 flex-grow text-sm">
          {description}
        </CardDescription>
        <div className="mt-6 flex items-center justify-between">
          <a href={`/integrations/${slug}`} className="text-sm font-semibold text-primary hover:underline">
            View details
          </a>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
