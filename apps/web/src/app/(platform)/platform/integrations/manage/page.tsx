"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isIntegrationsManageTab } from "./_components/integrations-manage-view";

export default function PlatformIntegrationsManageRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "";

  useEffect(() => {
    const targetTab = isIntegrationsManageTab(requestedTab) ? requestedTab : "webhooks";
    router.replace(`/platform/integrations/manage/${targetTab}`);
  }, [router, requestedTab]);

  return null;
}
