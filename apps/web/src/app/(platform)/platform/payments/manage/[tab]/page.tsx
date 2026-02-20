"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { isPaymentsManageTab } from "../_components/payments-manage-view";

export default function PlatformPaymentsManageTabPage() {
  const params = useParams<{ tab: string }>();
  const router = useRouter();
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  useEffect(() => {
    const targetTab = isPaymentsManageTab(rawTab) ? rawTab : "overview";
    router.replace(`/platform/payments/manage?tab=${targetTab}`);
  }, [rawTab, router]);

  return null;
}
