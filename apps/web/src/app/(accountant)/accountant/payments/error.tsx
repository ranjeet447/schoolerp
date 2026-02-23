"use client";

import { useEffect } from "react";
import { ErrorState } from "@schoolerp/ui";

export default function PaymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Payments segment error:", error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <ErrorState 
        title="Payment Processing Error" 
        description="An unexpected error occurred while loading the payment gateway or processing the transaction. Your account has not been charged."
        onRetry={reset}
      />
    </div>
  );
}
