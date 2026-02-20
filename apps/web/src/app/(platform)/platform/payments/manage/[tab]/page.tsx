"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PaymentsManageView, isPaymentsManageTab, type PaymentsManageTab } from "../_components/payments-manage-view";

export default function PlatformPaymentsManageTabPage() {
  const params = useParams<{ tab: string }>();
  const router = useRouter();
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const activeTab: PaymentsManageTab = isPaymentsManageTab(rawTab) ? rawTab : "overview";

  useEffect(() => {
    if (!isPaymentsManageTab(rawTab)) {
      router.replace("/platform/payments/manage/overview");
    }
  }, [rawTab, router]);

  return <PaymentsManageView activeTab={activeTab} />;
}
