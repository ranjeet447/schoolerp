"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentsManageView, isPaymentsManageTab, type PaymentsManageTab } from "./_components/payments-manage-view";

function PlatformPaymentsManageInner() {
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

export default function PlatformPaymentsManagePage() {
  return (
    <Suspense fallback={null}>
      <PlatformPaymentsManageInner />
    </Suspense>
  );
}
