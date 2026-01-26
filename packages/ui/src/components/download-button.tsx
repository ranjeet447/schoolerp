"use client";

import React from 'react';
import { Button } from './button';
import { Loader2, FileDown, AlertCircle } from 'lucide-react';

interface DownloadButtonWithStatusProps {
  status: 'idle' | 'generating' | 'ready' | 'error';
  onDownload: () => void;
  onRefresh?: () => void;
}

export const DownloadButtonWithStatus = ({ 
  status, 
  onDownload, 
  onRefresh 
}: DownloadButtonWithStatusProps) => {
  return (
    <div className="flex items-center gap-4">
      {status === 'idle' && (
        <Button onClick={onDownload} className="gap-2">
          <FileDown className="h-4 w-4" />
          Download One-Pager PDF
        </Button>
      )}
      
      {status === 'generating' && (
        <Button disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating PDF...
        </Button>
      )}
      
      {status === 'ready' && (
        <Button onClick={onDownload} variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
          <FileDown className="h-4 w-4" />
          Download Ready
        </Button>
      )}
      
      {status === 'error' && (
        <div className="flex items-center gap-2">
          <Button onClick={onRefresh} variant="outline" className="gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            Retry Generation
          </Button>
        </div>
      )}
    </div>
  );
};
