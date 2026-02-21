"use client";

import React, { useEffect, useState, useRef } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@schoolerp/ui";
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
      if (selectedType === "students") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiClient("/admin/sis/import", {
          method: "POST",
          body: formData,
          headers: {},
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
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline", icon: React.ElementType }> = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      processing: { label: "Processing", variant: "secondary", icon: Clock },
      completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
      failed: { label: "Failed", variant: "destructive", icon: XCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge variant={c.variant} className="gap-1 capitalize">
        <Icon className="h-3 w-3" /> {c.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Bulk Import</h1>
          <p className="text-muted-foreground font-medium">Import large datasets via CSV files.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {IMPORT_TYPES.map(t => (
          <Card 
            key={t.key} 
            className={`cursor-pointer transition-all ${selectedType === t.key ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}
            onClick={() => setSelectedType(t.key)}
          >
            <CardContent className="p-5 flex flex-col items-start text-left">
              <div className="text-3xl mb-2">{t.icon}</div>
              <h3 className="font-bold text-lg text-foreground">{t.label}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-lg">Upload CSV</CardTitle>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> Download Template
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6 text-sm">
            {["Download Template", "Fill Data", "Upload CSV"].map((step, i) => (
              <React.Fragment key={step}>
                {i > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                <span className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg font-bold">
                  <span className="text-primary mr-1">{i + 1}.</span> {step}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
            }`}>
            <FileSpreadsheet className={`h-16 w-16 mx-auto mb-4 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
            <p className="text-foreground font-bold text-lg mb-1">
              {uploading ? "Uploading…" : "Drop your CSV file here"}
            </p>
            <p className="text-muted-foreground text-sm">or click to browse</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
          </div>

          <div className="mt-4 bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-500">Expected columns for {selectedType}:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(TEMPLATES[selectedType] || []).map(col => (
                <span key={col} className="bg-background border text-muted-foreground text-xs px-2 py-1 rounded-md font-mono">{col}</span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-lg">Import History</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">{jobs.length} job(s)</span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-bold">No imports yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map(j => (
                <div key={j.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-bold">{j.file_name || "Unknown file"}</span>
                      <Badge variant="outline" className="capitalize">{j.type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(j.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-sm text-muted-foreground">
                      <span className="text-emerald-500 font-bold">{j.success_count}</span> / {j.total_rows}
                      {j.error_count > 0 && (
                        <span className="text-destructive ml-2">({j.error_count} errors)</span>
                      )}
                    </div>
                    {statusBadge(j.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
