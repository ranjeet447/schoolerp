"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label, 
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@schoolerp/ui";
import { toast } from "sonner";
import { 
  Scan, 
  BookOpen, 
  UserCheck, 
  History, 
  ChevronRight,
  Camera,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

export default function LibraryScanPage() {
  const [mode, setMode] = useState<"issue" | "return">("issue");
  const [barcode, setBarcode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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

  const handleScan = async (code: string) => {
    setBarcode(code);
    if (mode === "return") {
      processScan(code);
    }
  };

  const processScan = async (code: string = barcode) => {
    if (!code) {
      toast.error("Please scan or enter a barcode");
      return;
    }

    if (mode === "issue" && !studentId) {
      toast.error("Please provide a Student ID");
      return;
    }

    setIsProcessing(true);
    try {
      const endpoint = mode === "issue" ? "/admin/library/issues/scan-issue" : "/admin/library/issues/scan-return";
      const body = mode === "issue" 
        ? { barcode: code, student_id: studentId, days: 14 }
        : { barcode: code, remarks: "Scanned at desk" };

      const res = await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setLastResult(data);
        toast.success(mode === "issue" ? "Book issued successfully" : "Book returned successfully");
        setBarcode("");
        if (mode === "return") stopCamera();
      } else {
        const err = await res.text();
        toast.error(err || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
            Circulation <span className="text-indigo-500">Scan Desk</span>
          </h1>
          <p className="text-slate-400 font-medium">Instant book issuance and returns via QR/Barcode.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-900 border border-white/5 p-1 rounded-2xl h-14">
              <TabsTrigger 
                value="issue" 
                className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold italic uppercase transition-all"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Issue Book
              </TabsTrigger>
              <TabsTrigger 
                value="return" 
                className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold italic uppercase transition-all"
              >
                <History className="w-4 h-4 mr-2" /> Return Book
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <CardContent className="p-8 space-y-6">
                  {isCameraOpen ? (
                    <div className="aspect-video bg-black rounded-2xl overflow-hidden relative border-2 border-indigo-500/50 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-[40px] border-black/40 flex items-center justify-center">
                        <div className="w-64 h-40 border-2 border-indigo-500 rounded-xl relative">
                           <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -translate-x-1 -translate-y-1"></div>
                           <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white translate-x-1 -translate-y-1"></div>
                           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -translate-x-1 translate-y-1"></div>
                           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white translate-x-1 translate-y-1"></div>
                           <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-pulse"></div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="absolute bottom-4 right-4 bg-black/60 border-white/10 text-white"
                        onClick={stopCamera}
                      >
                        Close Camera
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="aspect-video bg-slate-800 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center group hover:border-indigo-500/50 transition-all cursor-pointer"
                      onClick={startCamera}
                    >
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="w-8 h-8 text-indigo-400" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Tap to Start Scanning</p>
                      <p className="text-slate-500 text-xs italic mt-2">Position barcode within the frame</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300 font-bold ml-1 uppercase text-[10px] tracking-widest">Book Barcode</Label>
                        <div className="relative">
                          <Scan className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <Input 
                            placeholder="Scan or Type Barcode"
                            className="h-14 pl-11 bg-slate-800 border-white/10 text-white font-bold focus:border-indigo-500 transition-all"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                          />
                        </div>
                      </div>
                      {mode === "issue" && (
                        <div className="space-y-2">
                          <Label className="text-slate-300 font-bold ml-1 uppercase text-[10px] tracking-widest">Student ID / UID</Label>
                          <div className="relative">
                            <UserCheck className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <Input 
                              placeholder="Admission Number"
                              className="h-14 pl-11 bg-slate-800 border-white/10 text-white font-bold focus:border-indigo-500 transition-all"
                              value={studentId}
                              onChange={(e) => setStudentId(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 italic uppercase"
                      onClick={() => processScan()}
                      disabled={isProcessing || !barcode}
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        mode === "issue" ? "Confirm Issue" : "Confirm Return"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/40 border-white/5 rounded-3xl overflow-hidden shadow-2xl h-full">
            <CardHeader className="border-b border-white/5 bg-slate-900/20">
              <CardTitle className="text-xl font-black text-white flex items-center gap-2 italic uppercase">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" /> Scan Result
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
              {lastResult ? (
                <div className="w-full space-y-6 animate-in fade-in zoom-in duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mb-2 uppercase font-black italic">SUCCESS</Badge>
                    <h3 className="text-xl font-black text-white italic uppercase">{mode === 'issue' ? 'Issued' : 'Returned'}</h3>
                  </div>

                  <div className="space-y-4 bg-white/5 rounded-2xl p-6 border border-white/5">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Transaction ID</span>
                        <span className="text-white font-mono text-xs">{lastResult.id?.slice(0,8)}...</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400">Time</span>
                        <span className="text-white">{format(new Date(), "hh:mm aa")}</span>
                     </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-white/5 bg-slate-800 text-slate-400 hover:text-white rounded-xl"
                    onClick={() => setLastResult(null)}
                  >
                    Next Scan
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4 opacity-50">
                  <Scan className="w-16 h-16 text-slate-600 mx-auto" />
                  <div>
                    <p className="text-slate-400 font-bold italic uppercase">Waiting for scan</p>
                    <p className="text-slate-500 text-xs mt-1">Results will appear here.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/10 rounded-3xl">
            <CardContent className="p-5 flex gap-4 items-start">
              <AlertCircle className="w-6 h-6 text-amber-500 mt-1 shrink-0" />
              <div className="space-y-1">
                <p className="text-amber-500 font-bold text-xs uppercase tracking-widest">Librarian Note</p>
                <p className="text-amber-500/70 text-[11px] leading-relaxed">Ensure the book condition is verified during return. Overdue fines are automatically calculated based on the return date.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
