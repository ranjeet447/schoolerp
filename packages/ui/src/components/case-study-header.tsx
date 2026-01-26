import React from 'react';
import { Badge } from './badge';

interface CaseStudyHeaderProps {
  title: string;
  schoolName: string;
  city: string;
  studentCount: number;
  category: string;
}

export const CaseStudyHeader = ({ 
  title, 
  schoolName, 
  city, 
  studentCount,
  category 
}: CaseStudyHeaderProps) => {
  return (
    <div className="space-y-4 border-b pb-8">
      <Badge variant="secondary" className="bg-primary/10 text-primary">
        Case Study: {category}
      </Badge>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-foreground">{schoolName}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{city}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium text-foreground">{studentCount.toLocaleString()} Students</span>
        </div>
      </div>
    </div>
  );
};
