import React from 'react';
import { StudentTable } from '@/components/students/student-table';
import { columns, Student } from '@/components/students/columns';
import { AddStudentDialog } from '@/components/students/add-student-dialog';
import { ImportStudentWizard } from '@/components/students/import-wizard';

async function getStudents(): Promise<Student[]> {
  // In a real server component, we can call the service directly or fetch from API
  // Since API is on standard port 8080
  try {
    const res = await fetch('http://localhost:8080/v1/admin/students?limit=100', {
        headers: { 
            'X-Tenant-ID': 'default-tenant' // Stub
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
