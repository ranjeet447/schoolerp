"use client";

import { ErrorState } from "@schoolerp/ui";
import { useEffect } from "react";

// Global Error applies to the root layout and catches errors in the root component
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex h-screen items-center justify-center bg-background">
        <ErrorState 
          type="error"
          title="Critical System Error"
          description="A critical error occurred preventing the application from loading."
          onRetry={() => reset()}
          onGoHome={() => window.location.href = "/"}
        />
      </body>
    </html>
  );
}
