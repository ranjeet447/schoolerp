import React from 'react';
import { getTenantConfig } from '@/lib/tenant-utils';
import ParentLayoutClient from './parent-layout-client';

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getTenantConfig();

  return (
    <ParentLayoutClient config={config}>
      {children}
    </ParentLayoutClient>
  );
}
