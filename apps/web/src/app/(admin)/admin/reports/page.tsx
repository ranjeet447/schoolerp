"use client";

import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Button
} from "@schoolerp/ui";
import { 
  Printer, 
  FileSpreadsheet, 
  Users, 
  CalendarDays, 
  Banknote, 
  PhoneCall, 
  GraduationCap,
  Loader2,
  Download
} from "lucide-react";
import { exportToCsv, printDocument } from "@/lib/exportUtils";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ClassSelect } from "@/components/ui/class-select";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("students");

  const handleAdmissionExport = async () => {
    const res = await apiClient("/admin/sis/students?limit=5000");
    const data = res.ok ? await res.json() : [];
    const formatted = (Array.isArray(data) ? data : data.data || []).map((s: any) => ({
      "Admission No": s.admission_number || "N/A",
      "Full Name": s.full_name,
      "Class": s.class_name || "N/A",
      "Gender": s.gender,
      "Date of Birth": s.date_of_birth ? format(new Date(s.date_of_birth), "dd-MMM-yyyy") : "N/A",
      "Enrollment Date": s.enrollment_date ? format(new Date(s.enrollment_date), "dd-MMM-yyyy") : "N/A",
      "Status": s.status,
    }));
    return { data: formatted, title: "Admission Register" };
  };

  const handleWithdrawnExport = async () => {
    const res = await apiClient("/admin/sis/students?limit=5000&status=withdrawn");
    const data = res.ok ? await res.json() : [];
    const formatted = (Array.isArray(data) ? data : data.data || []).map((s: any) => ({
      "Admission No": s.admission_number || "N/A",
      "Full Name": s.full_name,
      "Class": s.class_name || "N/A",
      "Withdrawal Date": s.updated_at ? format(new Date(s.updated_at), "dd-MMM-yyyy") : "N/A",
      "Reason": "TC Issued",
    }));
    return { data: formatted, title: "Withdrawn / TC Register" };
  };

  const handleDayBookExport = async () => {
    const res = await apiClient("/admin/finance/receipts?limit=5000");
    const data = res.ok ? await res.json() : [];
    const formatted = (Array.isArray(data) ? data : data.data || []).map((r: any) => ({
      "Receipt No": r.receipt_number,
      "Date": format(new Date(r.created_at), "dd-MMM-yyyy"),
      "Student": r.student_name || "Unknown",
      "Amount Paid": r.amount_paid,
      "Mode": r.payment_mode,
      "Status": r.status,
    }));
    return { data: formatted, title: "Daily Collection (Day Book)" };
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Office Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generate and export inspection-ready reports across all modules.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted border-border/50 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="students" className="rounded-lg gap-2">
            <Users className="h-4 w-4" /> Students
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg gap-2">
            <CalendarDays className="h-4 w-4" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg gap-2">
            <Banknote className="h-4 w-4" /> Finance
          </TabsTrigger>
          <TabsTrigger value="admissions" className="rounded-lg gap-2">
            <PhoneCall className="h-4 w-4" /> Admissions
          </TabsTrigger>
          <TabsTrigger value="academics" className="rounded-lg gap-2">
            <GraduationCap className="h-4 w-4" /> Academics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <ReportCard 
                title="Admission Register" 
                description="List of all admitted students with complete demographic and academic details."
                icon={<Users className="h-5 w-5 text-blue-500" />}
                fetchData={handleAdmissionExport}
             />
             <ReportCard 
                title="Withdrawn / TC Register" 
                description="Students who have left the institution or been issued Transfer Certificates."
                icon={<Users className="h-5 w-5 text-red-500" />}
                fetchData={handleWithdrawnExport}
             />
             <ReportCard 
                title="Defaulters List" 
                description="Students with pending fee dues beyond the grace period."
                icon={<Banknote className="h-5 w-5 text-orange-500" />}
                fetchData={async () => ({ data: [], title: "Defaulters List" })}
             />
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <AttendanceExportDialog />
             <ReportCard 
                title="Staff Attendance Summary" 
                description="Monthly attendance compilation for all teaching and non-teaching staff."
                icon={<CalendarDays className="h-5 w-5 text-purple-500" />}
                fetchData={async () => ({ data: [], title: "Staff Attendance" })}
             />
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <ReportCard 
                title="Daily Collection (Day Book)" 
                description="Summary of all fee receipts collected on a specific date."
                icon={<Banknote className="h-5 w-5 text-emerald-500" />}
                fetchData={handleDayBookExport}
             />
             <ReportCard 
                title="Head-wise Collection" 
                description="Breakdown of fee collections categorized by fee heads."
                icon={<Banknote className="h-5 w-5 text-teal-500" />}
                fetchData={async () => ({ data: [], title: "Head-wise Collection" })}
             />
          </div>
        </TabsContent>

        <TabsContent value="admissions" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <ReportCard 
                title="Enquiry Funnel" 
                description="Tracking of prospective student enquiries, follow-ups, and conversions."
                icon={<PhoneCall className="h-5 w-5 text-amber-500" />}
                fetchData={async () => ({ data: [], title: "Enquiry Funnel" })}
             />
          </div>
        </TabsContent>

        <TabsContent value="academics" className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <ReportCard 
                title="Class Performance Report" 
                description="Aggregated exam results and performance metrics by class."
                icon={<GraduationCap className="h-5 w-5 text-cyan-500" />}
                fetchData={async () => ({ data: [], title: "Class Performance" })}
             />
          </div>
        </TabsContent>

      </Tabs>
      
      {/* Hidden container for print rendering */}
      <div id="print-container" className="hidden"></div>
    </div>
  );
}

function ReportCard({ 
  title, 
  description, 
  icon,
  fetchData
}: { 
  title: string, 
  description: string, 
  icon: React.ReactNode,
  fetchData: () => Promise<{ data: any[], title: string }>
}) {
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    try {
      setLoading(true);
      const { data, title: reportTitle } = await fetchData();
      if (!data || data.length === 0) {
        toast.error("No data available to export");
        return;
      }
      exportToCsv(`${reportTitle.replace(/\s+/g, "_")}_${new Date().getTime()}.csv`, data);
      toast.success("Export successful");
    } catch (error) {
      toast.error("Failed to export data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onPrint = async () => {
    try {
      setLoading(true);
      const { data, title: reportTitle } = await fetchData();
      if (!data || data.length === 0) {
        toast.error("No data available to print");
        return;
      }
      
      // Generate HTML Table
      const keys = Object.keys(data[0]);
      const htmlContent = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h2>${reportTitle}</h2>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>${keys.map(k => `<td>${row[k] || ''}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      const container = document.getElementById("print-container");
      if (container) {
        container.innerHTML = htmlContent;
        printDocument("print-container", reportTitle);
      }
    } catch (error) {
      toast.error("Failed to prepare print document");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-card border-border/50 rounded-3xl hover:border-primary/50 transition-colors cursor-pointer group flex flex-col h-full">
      <CardHeader className="flex-1">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="mt-auto pt-4 border-t border-border/50">
        <div className="flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onExport(); }}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />} 
            Excel
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); onPrint(); }}
            disabled={loading}
          >
             {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2 text-indigo-600" />} 
             Print
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AttendanceExportDialog() {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);

  // Fallback UI import for Dialog
  // We'll just build a neat inline card here for simplicity if Dialog isn't purely exported. 
  // Let's use the actual Card but expand it on click.
  
  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }
    if (!selectedMonth) {
      toast.error("Please select a month");
      return;
    }

    try {
      setLoading(true);
      const url = `/admin/attendance/monthly-summary?class_section_id=${selectedClass}&month=${selectedMonth}`;
      
      const res = await apiClient(url);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attendance_summary_${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Export successful!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to generate export");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      className={`bg-card border-border/50 rounded-3xl hover:border-primary/50 transition-colors cursor-pointer flex flex-col ${open ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      onClick={() => setOpen(!open)}
    >
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-muted rounded-2xl">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Student Monthly Attendance</CardTitle>
            <CardDescription className="mt-1">Export comprehensive attendance data.</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {open && (
        <CardContent className="space-y-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Class</label>
            <div onClick={(e) => e.stopPropagation()}>
              <ClassSelect 
                value={selectedClass} 
                onSelect={setSelectedClass} 
                placeholder="Choose a class section..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Month</label>
            <input 
              type="month" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download CSV Export
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
