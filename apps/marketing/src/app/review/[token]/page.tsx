"use client";

import React, { useState } from 'react';
import { ReviewForm } from '@schoolerp/ui';

export default function ReviewSubmissionPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (data: any) => {
    setStatus('loading');
    try {
      // API call: POST /v1/public/reviews with token
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="container flex min-h-screen items-center justify-center py-24">
      <div className="w-full max-w-xl">
        <ReviewForm 
          schoolName="Demo International School" 
          onSubmit={handleSubmit} 
          status={status}
        />
      </div>
    </div>
  );
}
