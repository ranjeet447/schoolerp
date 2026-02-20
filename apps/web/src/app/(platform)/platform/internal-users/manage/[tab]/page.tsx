"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  InternalUsersManageView,
  isInternalUsersManageTab,
  type InternalUsersManageTab,
} from "../_components/internal-users-manage-view";

function normalizeLegacyTab(tab: string): string {
  if (tab === "roles" || tab === "permissions") return "rbac";
  if (tab === "invite") return "users";
  return tab;
}

export default function PlatformInternalUsersManageTabPage() {
  const params = useParams<{ tab: string }>();
  const router = useRouter();
  const rawTabInput = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const rawTab = normalizeLegacyTab(rawTabInput);
  const activeTab: InternalUsersManageTab = isInternalUsersManageTab(rawTab) ? rawTab : "users";

  useEffect(() => {
    if (!isInternalUsersManageTab(rawTab)) {
      router.replace("/platform/internal-users/manage/users");
    }
  }, [rawTab, router]);

  return <InternalUsersManageView activeTab={activeTab} />;
}
