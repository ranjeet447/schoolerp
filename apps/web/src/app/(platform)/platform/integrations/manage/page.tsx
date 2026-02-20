"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isIntegrationsManageTab } from "./_components/integrations-manage-view";

function PlatformIntegrationsManageRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "";

  useEffect(() => {
    const targetTab = isIntegrationsManageTab(requestedTab) ? requestedTab : "webhooks";
    router.replace(`/platform/integrations/manage/${targetTab}`);
  }, [router, requestedTab]);

  return null;
}

export default function PlatformIntegrationsManageRedirectPage() {
  return (
    <Suspense fallback={null}>
      <PlatformIntegrationsManageRedirectInner />
    </Suspense>
  );
}
