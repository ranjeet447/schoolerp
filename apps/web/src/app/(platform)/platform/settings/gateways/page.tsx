"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformGatewaysSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/platform/payments/manage?tab=config");
  }, [router]);

  return null;
}

