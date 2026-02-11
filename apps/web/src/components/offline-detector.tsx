"use client";

import React, { useEffect, useState } from "react";
import { ErrorState } from "@schoolerp/ui";

export function OfflineDetector({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Check initial state
    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <ErrorState
          type="offline"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return <>{children}</>;
}
