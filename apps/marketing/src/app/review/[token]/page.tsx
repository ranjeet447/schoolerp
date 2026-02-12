"use client";

import React, { useEffect, useState } from 'react';
import { ReviewForm } from '@schoolerp/ui';

export default function ReviewSubmissionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = React.use(params);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [schoolName, setSchoolName] = useState('School Partner');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReviewContext() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';
        const res = await fetch(`${apiBase}/public/review-requests/${token}`);
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || 'Could not load review request');
        }
        const data = await res.json();
        if (!cancelled && data?.school_name) {
          setSchoolName(data.school_name);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Review link may be expired or invalid.');
        }
      }
    }

    fetchReviewContext();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (data: any) => {
    setStatus('loading');
    setError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';
      const res = await fetch(`${apiBase}/public/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token }),
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to submit review');
      }
      setStatus('success');
    } catch (err) {
      setError('Could not submit your review. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="container flex min-h-screen items-center justify-center py-24">
      <div className="w-full max-w-xl">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <ReviewForm 
          schoolName={schoolName}
          onSubmit={handleSubmit} 
          status={status}
        />
      </div>
    </div>
  );
}
