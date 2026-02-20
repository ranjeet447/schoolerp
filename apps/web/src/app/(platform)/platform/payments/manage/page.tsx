"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentsManageView, isPaymentsManageTab, type PaymentsManageTab } from "./_components/payments-manage-view";

export default function PlatformPaymentsManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "";
  const activeTab: PaymentsManageTab = isPaymentsManageTab(requestedTab) ? requestedTab : "overview";

  useEffect(() => {
    if (!isPaymentsManageTab(requestedTab)) {
      router.replace("/platform/payments/manage?tab=overview");
    }
  }, [router, requestedTab]);

  return <PaymentsManageView activeTab={activeTab} />;
}
