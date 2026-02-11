import React from 'react';
import { StudentTable } from '@/components/students/student-table';
import { columns, Student } from '@/components/students/columns';
import { AddStudentDialog } from '@/components/students/add-student-dialog';
import { ImportStudentWizard } from '@/components/students/import-wizard';

import { headers } from 'next/headers';

async function getStudents(): Promise<Student[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // Resolve Tenant from Hostname
  const parts = host.split('.')
  let tenant = 'default-tenant'
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    tenant = parts[0]
  }

  try {
    const res = await fetch(`${API_URL}/admin/students?limit=100`, {
        headers: { 
            'X-Tenant-ID': tenant
        },
        cache: 'no-store'
    });
    
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch students", e);
    return [];
  }
}

export default async function StudentsPage() {
  const data = await getStudents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records, admissions, and status.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <ImportStudentWizard />
            <AddStudentDialog />
        </div>
      </div>

      <StudentTable columns={columns} data={data} />
    </div>
  );
}
