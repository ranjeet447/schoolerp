"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Input,
  Label,
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  Badge,
  Textarea
} from "@schoolerp/ui";
import { toast } from "sonner";
import { 
  QrCode, 
  Plus, 
  Search, 
  UserCheck, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Printer
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { StudentSelect } from "@/components/students/student-select";
import { QRCodeSVG } from "qrcode.react";

interface GatePass {
  id: string;
  student_name: string;
  requested_by_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'used' | 'expired';
  qr_code?: string;
  valid_from: string;
  valid_until: string;
  used_at?: string;
  created_at: string;
}

export default function GatePassPage() {
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<GatePass | null>(null);
  const [isQRDocsOpen, setIsQRDocsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    student_id: "",
    reason: ""
  });

  const fetchGatePasses = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient("/admin/safety/gate-passes");
      if (res.ok) {
        const data = await res.json();
        setGatePasses(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      toast.error("Failed to fetch gate passes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, []);

  const handleCreate = async () => {
    if (!formData.student_id || !formData.reason) {
      toast.error("Please select a student and provide a reason");
      return;
    }

    try {
      const res = await apiClient("/admin/safety/gate-passes", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Gate pass requested successfully");
        setIsCreateOpen(false);
        setFormData({ student_id: "", reason: "" });
        fetchGatePasses();
      } else {
        toast.error("Failed to request gate pass");
      }
    } catch (error) {
      toast.error("Failed to request gate pass");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await apiClient(`/admin/safety/gate-passes/${id}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Gate pass approved");
        fetchGatePasses();
      } else {
        toast.error("Failed to approve gate pass");
      }
    } catch (error) {
      toast.error("Failed to approve gate pass");
    }
  };

  const handleMarkUsed = async (id: string) => {
    try {
      const res = await apiClient(`/admin/safety/gate-passes/${id}/use`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Gate pass marked as used");
        fetchGatePasses();
      } else {
        toast.error("Failed to mark gate pass as used");
      }
    } catch (error) {
      toast.error("Failed to mark gate pass as used");
    }
  };

  const filteredPasses = gatePasses.filter(gp => 
    gp.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gp.reason?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Approved</Badge>;
      case 'used': return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Used</Badge>;
      case 'expired': return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Expired</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">Security <span className="text-indigo-500">Gate Passes</span></h1>
          <p className="text-slate-400 font-medium mt-1">
            Secure tracking of student entry and exit with QR-validated permissions.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-2xl transition-all shadow-lg active:scale-95 gap-2">
              <Plus className="w-5 h-5" /> Request Gate Pass
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 rounded-3xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">Create Request</DialogTitle>
              <DialogDescription className="text-slate-400">Request permission for a student to leave campus.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-slate-300 font-bold ml-1">Student</Label>
                <StudentSelect 
                  value={formData.student_id}
                  onValueChange={(val) => setFormData({ ...formData, student_id: val })}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-slate-300 font-bold ml-1">Reason for Exit</Label>
                <Textarea 
                  placeholder="Medical emergency, family pick-up, etc." 
                  className="bg-slate-800 border-white/5 focus:border-indigo-500 min-h-[100px] text-white"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="border-white/5 bg-transparent text-slate-400">Cancel</Button>
              <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl shadow-2xl group hover:border-indigo-500/30 transition-all">
          <CardHeader className="py-5">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">
              {gatePasses.filter(gp => gp.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl shadow-2xl group hover:border-emerald-500/30 transition-all">
          <CardHeader className="py-5">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active Passes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">
              {gatePasses.filter(gp => gp.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl shadow-2xl group hover:border-blue-500/30 transition-all">
          <CardHeader className="py-5">
            <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" /> Total Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white">
              {gatePasses.filter(gp => gp.status === 'used').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900/40 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <CardHeader className="border-b border-white/5 bg-slate-900/20 px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-black text-white">Pass History</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search student or reason..."
                className="bg-slate-800 border-white/5 pl-10 h-10 rounded-xl text-white focus:ring-1 focus:ring-indigo-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-slate-500 font-medium">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                Syncing security logs...
            </div>
          ) : filteredPasses.length === 0 ? (
            <div className="py-20 text-center">
                <ShieldCheck className="h-16 w-16 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No security records found for this period.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-slate-500 font-black tracking-tighter uppercase px-8 py-4">Student</TableHead>
                  <TableHead className="text-slate-500 font-black tracking-tighter uppercase">Reason</TableHead>
                  <TableHead className="text-slate-500 font-black tracking-tighter uppercase">Requested By</TableHead>
                  <TableHead className="text-slate-500 font-black tracking-tighter uppercase">Valid Thru</TableHead>
                  <TableHead className="text-slate-500 font-black tracking-tighter uppercase">Status</TableHead>
                  <TableHead className="text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasses.map((gp) => (
                  <TableRow key={gp.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell className="font-bold text-white px-8 py-5">{gp.student_name}</TableCell>
                    <TableCell className="text-slate-400 font-medium">{gp.reason}</TableCell>
                    <TableCell className="text-slate-400 font-medium">{gp.requested_by_name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs font-bold">
                        <span className="flex items-center gap-1 text-indigo-400">
                          <Clock className="w-3 h-3" /> {format(new Date(gp.valid_until), "p")}
                        </span>
                        <span className="text-slate-500">
                          {format(new Date(gp.valid_until), "MMM dd")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(gp.status)}</TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex justify-end gap-2">
                        {gp.status === 'pending' && (
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2"
                            onClick={() => handleApprove(gp.id)}
                          >
                            <ShieldCheck className="w-4 h-4" /> Approve
                          </Button>
                        )}
                        {(gp.status === 'approved' || gp.status === 'used') && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-white/10 hover:bg-white/5 text-slate-300 font-bold rounded-xl gap-2"
                            onClick={() => {
                              setSelectedPass(gp);
                              setIsQRDocsOpen(true);
                            }}
                          >
                            <QrCode className="w-4 h-4" /> View QR
                          </Button>
                        )}
                        {gp.status === 'approved' && (
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                            onClick={() => handleMarkUsed(gp.id)}
                          >
                            Sync Exit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isQRDocsOpen} onOpenChange={setIsQRDocsOpen}>
        <DialogContent className="bg-slate-900 border-white/10 rounded-[2.5rem] max-w-sm p-8">
          <DialogHeader className="text-center p-0">
            <DialogTitle className="text-2xl font-black text-white uppercase italic">Security <span className="text-indigo-500">Pass</span></DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-8 py-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-[0_0_50px_rgba(79,70,229,0.3)]">
                {selectedPass?.qr_code && (
                    <QRCodeSVG 
                        value={selectedPass.qr_code} 
                        size={200}
                        level="H"
                        includeMargin={false}
                    />
                )}
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">{selectedPass?.student_name}</h3>
                <p className="text-slate-500 text-sm font-medium italic">VALID UNTIL {selectedPass?.valid_until && format(new Date(selectedPass.valid_until), "p, MMM dd")}</p>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1 border-white/5 bg-slate-800 text-white rounded-2xl gap-2 h-12">
                    <Download className="w-4 h-4" /> Save
                </Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl gap-2 h-12">
                    <Printer className="w-4 h-4" /> Print
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

