"use client";

import { useEffect } from "react";
import { ErrorState } from "@schoolerp/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <ErrorState 
        type="error"
        title="We encountered an issue"
        description="Don't worry, our team has been notified. You can try reloading the page."
        onRetry={() => reset()}
        onGoHome={() => window.location.href = "/"}
      />
    </div>
  );
}
