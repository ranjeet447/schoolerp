"use client";

import React, { useEffect, useState } from 'react';
import { StudentTable } from '@/components/students/student-table';
import { Button } from "@schoolerp/ui";
import { columns, Student } from '@/components/students/columns';
import { AddStudentDialog } from '@/components/students/add-student-dialog';
import { ImportStudentWizard } from '@/components/students/import-wizard';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  Download,
  Filter,
  Search,
} from 'lucide-react';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      try {
        const res = await apiClient('/admin/students?limit=100');
        if (!res.ok) {
          setStudents([]);
          return;
        }

        const payload = await res.json();
        if (Array.isArray(payload)) {
          setStudents(payload);
        } else {
          setStudents(payload?.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch students:', error);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Student Directory</h1>
          <p className="text-slate-400 font-medium">Manage student records, admissions, and academic profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <ImportStudentWizard />
          <AddStudentDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Students</span>
          </div>
          <div className="text-4xl font-black text-white">{students.length}</div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              placeholder="Search by name, roll no, or class..."
              className="w-full h-11 pl-11 bg-slate-800/50 border border-white/5 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <Filter className="h-4 w-4 mr-2" /> Filters
            </Button>
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        <StudentTable columns={columns} data={students} />
        {loading && (
          <div className="p-4 text-sm text-slate-400">Loading students...</div>
        )}
      </div>
    </div>
  );
}
