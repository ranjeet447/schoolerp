import React from 'react';
import { getTenantConfig } from '@/lib/tenant-utils';
import StudentLayoutClient from './student-layout-client';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getTenantConfig();

  return (
    <StudentLayoutClient config={config}>
      {children}
    </StudentLayoutClient>
  );
}
