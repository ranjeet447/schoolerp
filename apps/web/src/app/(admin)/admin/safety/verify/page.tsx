"use client";

import { useState } from "react";
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
  Textarea
} from "@schoolerp/ui";
import { toast } from "sonner";
import { 
  ShieldCheck,
  QrCode,
  KeyRound,
  UserCheck,
  AlertCircle,
  Clock,
  MapPin
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

export default function GatekeeperVerifyPage() {
  const [method, setMethod] = useState<"qr" | "otp">("qr");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiClient("/admin/safety/pickups/verify", {
        method: "POST",
        body: JSON.stringify({ code: code.trim(), notes })
      });

      if (res.ok) {
        const data = await res.json();
        setLastEvent(data);
        toast.success("Pickup verified successfully!");
        setCode("");
        setNotes("");
      } else {
        const err = await res.text();
        toast.error(err || "Verification failed");
      }
    } catch (error) {
      toast.error("An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 mt-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-white italic uppercase">
          Gate <span className="text-indigo-500">Verification</span>
        </h1>
        <p className="text-slate-400 font-medium">Scan QR code or enter OTP to authorize student pickup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="border-b border-white/5 bg-slate-900/20">
              <div className="flex gap-2">
                <Button 
                  variant={method === "qr" ? "default" : "outline"}
                  onClick={() => setMethod("qr")}
                  className={method === "qr" ? "bg-indigo-600" : "border-white/5 text-slate-400"}
                >
                  <QrCode className="w-4 h-4 mr-2" /> QR Scan
                </Button>
                <Button 
                  variant={method === "otp" ? "default" : "outline"}
                  onClick={() => setMethod("otp")}
                  className={method === "otp" ? "bg-indigo-600" : "border-white/5 text-slate-400"}
                >
                  <KeyRound className="w-4 h-4 mr-2" /> Manual OTP
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {method === "qr" ? (
                <div className="aspect-square bg-slate-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-white/10 group hover:border-indigo-500/50 transition-all cursor-pointer">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <QrCode className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-slate-400 font-bold">In development: Camera Feed</p>
                  <p className="text-slate-500 text-sm italic mt-2 text-center px-4">Use manual entry for now to test verification logic.</p>
                  <Button 
                    variant="link" 
                    className="mt-4 text-indigo-400 font-bold"
                    onClick={() => setMethod("otp")}
                  >
                    Switch to Manual OTP
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 font-bold ml-1">Verification Code</Label>
                    <Input 
                      placeholder="Enter 6-digit OTP or QR Token"
                      className="h-16 text-center text-3xl font-black tracking-[0.5em] bg-slate-800 border-white/10 text-white focus:border-indigo-500"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 font-bold ml-1">Gatekeeper Notes</Label>
                    <Textarea 
                      placeholder="Vehicle number, id verified, etc."
                      className="bg-slate-800 border-white/10 text-white min-h-[100px]"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    onClick={handleVerify}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <ShieldCheck className="w-6 h-6" /> Verify & Authorize
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/10 rounded-3xl">
            <CardContent className="p-4 flex gap-4 items-start">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-amber-500 font-bold text-sm">Security Policy</p>
                <p className="text-amber-500/70 text-xs">Verify the identity of the person picking up the student. If the system flags an unauthorized pickup, contact the main office immediately.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-900/40 border-white/5 rounded-3xl overflow-hidden shadow-2xl h-full min-h-[400px]">
            <CardHeader className="border-b border-white/5 bg-slate-900/20">
              <CardTitle className="text-xl font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" /> Verification Result
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[350px]">
              {lastEvent ? (
                <div className="w-full space-y-8 animate-in fade-in zoom-in duration-300">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-12 h-12 text-emerald-500" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mb-2">PICKUP AUTHORIZED</Badge>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">Verified Dismissal</h3>
                  </div>

                  <div className="space-y-4 bg-white/5 rounded-2xl p-6 border border-white/5">
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Student</span>
                      <span className="text-white font-black">Success - Record Created</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Time</span>
                      <span className="text-white font-black">{format(new Date(), "PPpp")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Status</span>
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 italic font-black">SYNCED</Badge>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-white/5 bg-slate-800 text-slate-400 hover:text-white"
                    onClick={() => setLastEvent(null)}
                  >
                    Clear Result
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                    <UserCheck className="w-10 h-10 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold italic uppercase tracking-tighter">Waiting for code</p>
                    <p className="text-slate-500 text-xs mt-2 italic">Student details will appear here after verification.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
