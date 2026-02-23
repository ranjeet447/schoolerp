"use client";

import { useEffect } from "react";
import { ErrorState } from "@schoolerp/ui";

export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our observability service
    console.error("Billing segment error:", error);
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <ErrorState 
        title="Billing Error" 
        description="We encountered an issue loading your billing dashboard or processing the payment configuration. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
