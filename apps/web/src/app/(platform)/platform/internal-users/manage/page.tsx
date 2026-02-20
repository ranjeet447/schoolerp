"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isInternalUsersManageTab } from "./_components/internal-users-manage-view";

function normalizeLegacyTab(tab: string): string {
  if (tab === "roles" || tab === "permissions") return "rbac";
  if (tab === "invite") return "users";
  return tab;
}

function PlatformInternalUsersManageRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = normalizeLegacyTab(searchParams.get("tab") || "");

  useEffect(() => {
    const targetTab = isInternalUsersManageTab(requestedTab) ? requestedTab : "users";
    router.replace(`/platform/internal-users/manage/${targetTab}`);
  }, [router, requestedTab]);

  return null;
}

export default function PlatformInternalUsersManageRedirectPage() {
  return (
    <Suspense fallback={null}>
      <PlatformInternalUsersManageRedirectInner />
    </Suspense>
  );
}
