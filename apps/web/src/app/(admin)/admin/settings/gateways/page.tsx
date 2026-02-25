"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent } from "@schoolerp/ui";

export default function AdminGatewaysRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const id = window.setTimeout(() => {
      router.replace("/admin/settings/plugins");
    }, 300);
    return () => window.clearTimeout(id);
  }, [router]);

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Gateways Moved</h1>
          <p className="text-sm text-muted-foreground">
            Gateway activation and pricing are managed through the platform add-on workflow.
            Tenant admins can request/activate add-ons for their own tenant and configure usage settings.
          </p>
          <div className="flex gap-2">
            <Button type="button" onClick={() => router.replace("/admin/settings/plugins")}>
              Open Add-ons
            </Button>
            <Button type="button" variant="outline" onClick={() => router.replace("/admin/billing")}>
              Open Billing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

