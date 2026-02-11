import React from 'react';
import { getTenantConfig } from '@/lib/tenant-utils';
import TeacherLayoutClient from './teacher-layout-client';

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getTenantConfig();

  return (
    <TeacherLayoutClient config={config}>
      {children}
    </TeacherLayoutClient>
  );
}
