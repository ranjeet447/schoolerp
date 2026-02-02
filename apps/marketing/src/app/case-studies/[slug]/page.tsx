"use client";

import React, { useState, useEffect } from 'react';
import { DownloadButtonWithStatus } from '@schoolerp/ui';

interface CaseStudyPageProps {
  params: { slug: string };
}

export default function CaseStudyPage({ params }: CaseStudyPageProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');

  const requestPdf = async () => {
    setStatus('generating');
    try {
      const res = await fetch(`/api/public/case-studies/${params.slug}/pdf`, { method: 'POST' });
      const data = await res.json();
      setJobId(data.job_id);
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobId && status === 'generating') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/public/pdf-jobs/${jobId}`);
          const data = await res.json();
          if (data.status === 'completed') {
            setStatus('ready');
            clearInterval(interval);
          } else if (data.status === 'failed') {
            setStatus('error');
            clearInterval(interval);
          }
        } catch (err) {
          setStatus('error');
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleDownload = () => {
    if (status === 'ready') {
      window.open(`/api/public/files/stub-file-id`, '_blank');
    } else {
      requestPdf();
    }
  };

  return (
    <div className="container py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">How Demo School Scaled to 4000+ Students</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Learn how the platform transformed administrative efficiency by 85%.
        </p>
        
        <div className="mt-12">
          <DownloadButtonWithStatus 
            status={status} 
            onDownload={handleDownload} 
            onRefresh={requestPdf}
          />
        </div>

        <article className="prose prose-slate mt-16 max-w-none">
          <h2>The Problem</h2>
          <p>Manual fee collection was leading to 15% revenue leakage...</p>
          
          <h2>The Solution</h2>
          <p>Implementation of the automated finance module with real-time Tally sync...</p>
        </article>
      </div>
    </div>
  );
}
