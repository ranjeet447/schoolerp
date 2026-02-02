import React from 'react';
import { Button } from '@schoolerp/ui';
import Link from 'next/link';

export default function BookingSuccessPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-24">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-bold">Demo Scheduled!</h1>
        <p className="mt-4 text-muted-foreground">
          We've sent a calendar invitation and confirmation to your email. See you there!
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Link href="/">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
