"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IntegrationsManageView,
  isIntegrationsManageTab,
  type IntegrationsManageTab,
} from "../_components/integrations-manage-view";

export default function PlatformIntegrationsManageTabPage() {
  const params = useParams<{ tab: string }>();
  const router = useRouter();
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const activeTab: IntegrationsManageTab = isIntegrationsManageTab(rawTab) ? rawTab : "webhooks";

  useEffect(() => {
    if (!isIntegrationsManageTab(rawTab)) {
      router.replace("/platform/integrations/manage/webhooks");
    }
  }, [rawTab, router]);

  return <IntegrationsManageView activeTab={activeTab} />;
}
