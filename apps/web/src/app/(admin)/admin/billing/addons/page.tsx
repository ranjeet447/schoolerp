"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BillingAddonsAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/billing?tab=addons");
  }, [router]);

  return <div className="p-6 text-sm text-muted-foreground">Redirecting to Billing Add-ons...</div>;
}

