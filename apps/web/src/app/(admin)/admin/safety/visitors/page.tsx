"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Input,
  Label,
  Badge,
  Textarea,
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
  DialogTrigger,
} from "@schoolerp/ui";
import { toast } from "sonner";
import { 
  UserPlus, 
  Camera, 
  Scan, 
  UserCheck, 
  Clock, 
  Phone, 
  Users, 
  Search,
  CheckCircle2,
  XCircle,
  X
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

export default function VisitorPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    purpose: "",
    id_type: "aadhaar",
    id_number: "",
    contact_person_id: "",
    badge_number: "",
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient("/admin/safety/visitors/logs");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (error) {
      toast.error("Failed to fetch visitor logs");
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Could not access camera");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleCheckIn = async () => {
    if (!formData.full_name || !formData.phone || !formData.purpose) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsProcessing(true);
    try {
      // In a real app, we'd upload the photo to S3 first. 
      // For this demo, we'll send it as a base64 string or assume it's handled.
      // The backend expects a PhotoURL. We'll pass a placeholder or the base64 if it's small.
      const res = await apiClient("/admin/safety/visitors/check-in", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          photo_url: capturedPhoto // Base64 for now
        })
      });

      if (res.ok) {
        toast.success("Visitor checked in successfully");
        setIsCheckInOpen(false);
        setFormData({
          full_name: "",
          phone: "",
          email: "",
          purpose: "",
          id_type: "aadhaar",
          id_number: "",
          contact_person_id: "",
          badge_number: "",
        });
        setCapturedPhoto(null);
        fetchLogs();
      } else {
        const err = await res.text();
        toast.error(err || "Check-in failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      const res = await apiClient(`/admin/safety/visitors/check-out/${id}`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Visitor checked out");
        fetchLogs();
      }
    } catch (error) {
      toast.error("Check-out failed");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">
            Visitor <span className="text-indigo-500">Management</span>
          </h1>
          <p className="text-slate-400">Track and verify campus visitors in real-time.</p>
        </div>
        
        <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-2xl font-bold gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
              <UserPlus className="w-5 h-5" /> New Visitor Check-In
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-slate-900 border-white/5 p-0 overflow-hidden rounded-3xl">
            <div className="bg-indigo-600 p-6">
              <DialogTitle className="text-2xl font-black text-white italic uppercase">Visitor Registration</DialogTitle>
              <p className="text-indigo-100/70 text-sm">Fill in details and capture proof of identity.</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {/* Photo Section */}
              <div className="space-y-4">
                <Label className="text-slate-300 font-bold uppercase text-xs tracking-widest">Entry Photo</Label>
                <div className="aspect-[4/3] bg-slate-800 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center overflow-hidden relative group">
                  {capturedPhoto ? (
                    <>
                      <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setCapturedPhoto(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : isCameraOpen ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        <Button onClick={capturePhoto} className="bg-white text-black hover:bg-white/90 rounded-full h-12 w-12 p-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </Button>
                        <Button onClick={stopCamera} variant="outline" className="bg-black/50 border-white/20 text-white rounded-full h-12 w-12 p-0">
                          <XCircle className="w-6 h-6" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <Camera className="w-8 h-8 text-indigo-400" />
                      </div>
                      <Button variant="outline" className="border-white/10 text-slate-300" onClick={startCamera}>
                        Capture Photo
                      </Button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 font-bold ml-1">Identity Proof</Label>
                  <div className="flex gap-2">
                    <select 
                      className="bg-slate-800 border-white/10 text-white rounded-xl px-3 h-11 w-1/3 text-sm focus:ring-2 ring-indigo-500 outline-none"
                      value={formData.id_type}
                      onChange={(e) => setFormData({...formData, id_type: e.target.value})}
                    >
                      <option value="aadhaar">Aadhaar</option>
                      <option value="driving_license">DL</option>
                      <option value="voter_id">Voter ID</option>
                      <option value="passport">Passport</option>
                    </select>
                    <Input 
                      placeholder="ID Number" 
                      className="bg-slate-800 border-white/10 text-white"
                      value={formData.id_number}
                      onChange={(e) => setFormData({...formData, id_number: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Detail Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 font-bold ml-1">Full Name *</Label>
                  <Input 
                    placeholder="Visitor's Name" 
                    className="bg-slate-800 border-white/10 text-white h-11"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 font-bold ml-1">Phone Number *</Label>
                  <Input 
                    placeholder="Mobile Number" 
                    className="bg-slate-800 border-white/10 text-white h-11"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 font-bold ml-1">Email Address</Label>
                  <Input 
                    placeholder="Optional" 
                    className="bg-slate-800 border-white/10 text-white h-11"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 font-bold ml-1">Purpose of Visit *</Label>
                  <Input 
                    placeholder="Ex: Meeting Principal" 
                    className="bg-slate-800 border-white/10 text-white h-11"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 font-bold ml-1">Badge / Gate No.</Label>
                  <Input 
                    placeholder="Optional" 
                    className="bg-slate-800 border-white/10 text-white h-11"
                    value={formData.badge_number}
                    onChange={(e) => setFormData({...formData, badge_number: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-white/5 flex gap-3">
              <Button variant="ghost" className="flex-1 text-slate-400 font-bold" onClick={() => setIsCheckInOpen(false)}>Cancel</Button>
              <Button 
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 font-black italic uppercase italic tracking-wider h-12 rounded-2xl"
                onClick={handleCheckIn}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Complete Check-In"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 bg-slate-900/40 border-white/5 rounded-3xl h-fit">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-indigo-400">Live Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-slate-300 font-medium">Currently In</span>
              </div>
              <span className="text-2xl font-black text-white">{logs.filter(l => !l.check_out_at).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
                <span className="text-slate-300 font-medium">Today's Total</span>
              </div>
              <span className="text-2xl font-black text-white">{logs.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-slate-900 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4 px-6 bg-slate-900/40">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2 italic uppercase">
              <Clock className="w-5 h-5 text-indigo-400" /> Visitor Logs
            </CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input placeholder="Search logs..." className="bg-slate-800 border-none h-9 pl-9 w-64 text-sm" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/5">
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-6">Visitor</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Purpose</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Check-In</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-500 italic">No visitors logged today.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-white/5 border-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                             {log.entry_photo_url ? (
                               <img src={log.entry_photo_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-slate-600">
                                 <Scan className="w-5 h-5" />
                               </div>
                             )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{log.visitor_name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {log.visitor_phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-slate-300 font-medium">{log.purpose}</p>
                        {log.contact_person_name && <p className="text-[10px] text-indigo-400 italic">Visited: {log.contact_person_name}</p>}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{format(new Date(log.check_in_at), "hh:mm aa")}</TableCell>
                      <TableCell>
                        {log.check_out_at ? (
                          <Badge variant="outline" className="bg-slate-800 text-slate-400 border-transparent font-medium">Checked Out</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black animate-pulse">On Campus</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {!log.check_out_at && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-slate-800 border-white/5 text-slate-400 hover:text-white rounded-xl h-8 px-4"
                            onClick={() => handleCheckOut(log.id)}
                          >
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
