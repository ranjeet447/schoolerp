"use client";

import React, { useState, useEffect } from 'react';
import { DownloadButtonWithStatus } from '@schoolerp/ui';
import { notFound } from 'next/navigation';

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

const CASE_STUDIES: Record<string, { title: string; subtitle: string; problem: string; solution: string }> = {
  'demo-school-scale': {
    title: 'How Demo School Scaled to 4000+ Students',
    subtitle: 'Learn how the platform transformed administrative efficiency by 85%.',
    problem: 'Manual fee collection was leading to 15% revenue leakage. Tracking individual student payments across thousands of students was prone to human error, resulting in significant financial discrepancies and administrative burden.',
    solution: 'Implementation of the automated finance module with real-time Tally sync ensured 100% accurate fee tracking. Automated receipts and instant reconciliation reduced the workload on the finance team by 85%.'
  },
  'heritage-multi-branch': {
    title: 'Unifying 12 Branches for The Heritage Group',
    subtitle: 'Achieving centralized control and real-time visibility across all campuses.',
    problem: 'With 12 branches operating in silos, the management lacked a consolidated view of finances, admissions, and operations. Data consolidation took weeks, delaying critical decision-making.',
    solution: 'We deployed a centralized dashboard that aggregates data from all branches in real-time. This provided the management with instant insights into key metrics, enabling data-driven decisions and standardized processes across all schools.'
  },
  'regional-success': {
    title: 'Bridging the Language Gap in Rural Maharashtra',
    subtitle: 'Empowering staff with a fully localized Marathi interface.',
    problem: 'The previous English-only software saw low adoption rates among support staff and parents in rural Maharashtra, leading to communication gaps and reliance on manual registers.',
    solution: 'Our complete localization of the interface into Marathi, including support for vernacular inputs, resulted in 100% staff adoption. Parents could now access the app in their native language, significantly improving engagement.'
  },
  'safety-overhaul': {
    title: 'Securing the Campus for St. Mary’s',
    subtitle: 'Achieving zero incidents with QR-based visitor management.',
    problem: 'Manual logbooks for visitors and students were prone to errors and manipulation. The school faced challenges in tracking authorized pickups and monitoring student movement.',
    solution: 'We implemented a QR-based gate pass system and real-time bus tracking. Parents now receive instant notifications when their child enters/exits the campus or boards the bus.'
  },
  'parent-trust': {
    title: 'Rebuilding Parent Trust with Transparency',
    subtitle: 'Bridging the gap between home and school with instant updates.',
    problem: 'Parents felt disconnected from their child’s academic progress and daily activities due to infrequent communication. This led to anxiety and a high volume of calls to the school office.',
    solution: 'Our dedicated parent app provides real-time updates on attendance, homework, and exam results. Two-way messaging channels ensure seamless communication, building trust and satisfaction.'
  }
};

export default function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = React.use(params);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');

  const study = CASE_STUDIES[slug];

  if (!study) {
    return notFound();
  }

  const requestPdf = async () => {
    setStatus('generating');
    try {
      const res = await fetch(`/api/public/case-studies/${slug}/pdf`, { method: 'POST' });
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
        <h1 className="text-4xl font-bold">{study.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {study.subtitle}
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
          <p>{study.problem}</p>
          
          <h2>The Solution</h2>
          <p>{study.solution}</p>
        </article>
      </div>
    </div>
  );
}
