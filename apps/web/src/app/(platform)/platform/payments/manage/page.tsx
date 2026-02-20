"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isPaymentsManageTab } from "./_components/payments-manage-view";

export default function PlatformPaymentsManageRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") || "";

  useEffect(() => {
    const targetTab = isPaymentsManageTab(requestedTab) ? requestedTab : "overview";
    router.replace(`/platform/payments/manage/${targetTab}`);
  }, [router, requestedTab]);

  return null;
}
