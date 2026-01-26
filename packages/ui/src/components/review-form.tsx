"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { StarRating } from './star-rating';

interface ReviewFormProps {
  schoolName: string;
  onSubmit: (data: any) => Promise<void>;
  status?: 'idle' | 'loading' | 'success' | 'error';
}

export const ReviewForm = ({ schoolName, onSubmit, status = 'idle' }: ReviewFormProps) => {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [consent, setConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ rating, content, consent });
  };

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-green-50 p-8 text-center">
        <h3 className="text-xl font-bold text-green-900">Thank you for your feedback!</h3>
        <p className="mt-2 text-green-700">Your review has been submitted for moderation.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-xl border bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review for {schoolName}</h2>
        <p className="text-muted-foreground">Share your experience with School ERP.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-semibold">Your Rating</label>
        <StarRating rating={rating} onRatingChange={setRating} />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-semibold">
          Your Experience
        </label>
        <textarea
          id="content"
          rows={5}
          maxLength={1000}
          required
          placeholder="What do you like most about using the platform?"
          className="block w-full rounded-md border-input bg-background px-4 py-2 ring-1 ring-inset ring-input focus:ring-2 focus:ring-primary sm:text-sm"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <p className="text-right text-xs text-muted-foreground">
          {content.length}/1000 characters
        </p>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
        />
        <label htmlFor="consent" className="text-sm text-muted-foreground">
          I give permission to publish this review on the website.
        </label>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  );
};
