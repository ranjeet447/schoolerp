import React from 'react';
import { getTenantConfig } from '@/lib/tenant-utils';
import AdminLayoutClient from './admin-layout-client';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getTenantConfig();

  return (
    <AdminLayoutClient config={config}>
      {children}
    </AdminLayoutClient>
  );
}
