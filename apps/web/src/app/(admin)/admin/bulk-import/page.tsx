"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, Download,
  AlertTriangle, Clock, ArrowRight,
} from "lucide-react";

interface ImportJob {
  id: string;
  type: string;
  status: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: string[];
  file_name: string;
  created_at: string;
}

const IMPORT_TYPES = [
  { key: "students", label: "Students", icon: "👨‍🎓", desc: "Import student records from CSV" },
  { key: "employees", label: "Employees", icon: "👨‍🏫", desc: "Import staff/employee records" },
];

const TEMPLATES: Record<string, string[]> = {
  students: ["full_name", "admission_no", "email", "phone", "date_of_birth", "gender", "class_name", "section_name", "address", "guardian_name", "guardian_phone", "guardian_email"],
  employees: ["full_name", "employee_code", "email", "phone", "department", "designation", "join_date"],
};

export default function BulkImportPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("students");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/admin/import-jobs");
      if (res.ok) setJobs(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadJobs(); }, []);

  const downloadTemplate = () => {
    const cols = TEMPLATES[selectedType] || [];
    const csv = cols.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedType}_import_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    setUploading(true);
    try {
      // For student CSV, use existing SIS import endpoint
      if (selectedType === "students") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiClient("/admin/sis/import", {
          method: "POST",
          body: formData,
          headers: {}, // Let browser set content-type with boundary
        });
        if (res.ok) {
          const result = await res.json();
          alert(`Import complete: ${result.success_count || 0} imported, ${result.error_count || 0} errors`);
        } else {
          const err = await res.text();
          alert(`Import failed: ${err}`);
        }
      }
    } catch (e: unknown) {
      console.error(e);
      alert("Upload failed");
    }
    setUploading(false);
    loadJobs();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; class: string; icon: React.ElementType }> = {
      pending: { label: "Pending", class: "bg-slate-500/10 text-slate-400", icon: Clock },
      processing: { label: "Processing", class: "bg-amber-500/10 text-amber-400", icon: Clock },
      completed: { label: "Completed", class: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
      failed: { label: "Failed", class: "bg-red-500/10 text-red-400", icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`${c.class} px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1`}>
        <Icon className="h-3 w-3" /> {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Bulk Import</h1>
          <p className="text-slate-400 font-medium">Import large datasets via CSV files.</p>
        </div>
      </div>

      {/* Import Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IMPORT_TYPES.map(t => (
          <button key={t.key} onClick={() => setSelectedType(t.key)}
            className={`bg-slate-900/50 border rounded-2xl p-5 text-left transition-all ${
              selectedType === t.key
                ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                : "border-white/5 hover:border-white/10"
            }`}>
            <div className="text-3xl mb-2">{t.icon}</div>
            <h3 className="text-white font-bold text-lg">{t.label}</h3>
            <p className="text-sm text-slate-500 mt-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Upload CSV</h2>
          </div>
          <Button variant="ghost" onClick={downloadTemplate} className="text-indigo-400 hover:text-indigo-300 rounded-xl text-sm">
            <Download className="h-4 w-4 mr-2" /> Download Template
          </Button>
        </div>

        <div className="p-6">
          {/* Steps */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            {["Download Template", "Fill Data", "Upload CSV"].map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <ArrowRight className="h-4 w-4 text-slate-700" />}
                <span className="bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg font-bold">
                  <span className="text-indigo-400 mr-1">{i + 1}.</span> {step}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20"
            }`}>
            <FileSpreadsheet className={`h-16 w-16 mx-auto mb-4 ${dragOver ? "text-indigo-400" : "text-slate-700"}`} />
            <p className="text-white font-bold text-lg mb-1">
              {uploading ? "Uploading…" : "Drop your CSV file here"}
            </p>
            <p className="text-slate-500 text-sm">or click to browse</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          </div>

          {/* Expected columns */}
          <div className="mt-4 bg-slate-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">Expected columns for {selectedType}:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(TEMPLATES[selectedType] || []).map(col => (
                <span key={col} className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded-md font-mono">{col}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-slate-900/50 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Clock className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Import History</h2>
          <span className="ml-auto text-sm text-slate-500">{jobs.length} job(s)</span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">No imports yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {jobs.map(j => (
              <div key={j.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{j.file_name || "Unknown file"}</span>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-md capitalize">{j.type}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(j.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">
                    <span className="text-emerald-400 font-bold">{j.success_count}</span> / {j.total_rows}
                    {j.error_count > 0 && (
                      <span className="text-red-400 ml-2">({j.error_count} errors)</span>
                    )}
                  </div>
                  {statusBadge(j.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
