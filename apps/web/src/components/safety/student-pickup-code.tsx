"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Badge
} from "@schoolerp/ui";
import { 
  QrCode, 
  RefreshCw, 
  Clock, 
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { format, differenceInSeconds } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

interface PickupCode {
  id: string;
  code_type: 'qr' | 'otp';
  code_value: string;
  expires_at: string;
}

export function StudentPickupCode({ studentId }: { studentId: string }) {
  const [activeCode, setActiveCode] = useState<PickupCode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchActiveCode = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient(`/admin/safety/pickups/active-codes/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        // Take the first active code if available
        if (Array.isArray(data) && data.length > 0) {
          setActiveCode(data[0]);
        } else {
          setActiveCode(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch pickup code", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async (type: 'qr' | 'otp') => {
    try {
      setIsGenerating(true);
      const res = await apiClient("/admin/safety/pickups/generate-code", {
        method: "POST",
        body: JSON.stringify({ 
          student_id: studentId,
          code_type: type
        })
      });
      if (res.ok) {
        const newCode = await res.json();
        setActiveCode(newCode);
      }
    } catch (error) {
      console.error("Failed to generate code", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchActiveCode();
  }, [studentId]);

  useEffect(() => {
    if (!activeCode) return;

    const interval = setInterval(() => {
      const seconds = differenceInSeconds(new Date(activeCode.expires_at), new Date());
      if (seconds <= 0) {
        setActiveCode(null);
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        setTimeLeft(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900/50 border-white/5 rounded-3xl">
        <CardContent className="p-8">
          <div className="h-40 w-full bg-white/5 rounded-2xl animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden shadow-2xl group hover:border-indigo-500/30 transition-all">
      <CardHeader className="py-5 border-b border-white/5 bg-slate-900/20">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Pickup Code
          </CardTitle>
          {timeLeft !== null && (
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] font-black italic">
              EXPIRES IN {formatTime(timeLeft)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8 flex flex-col items-center justify-center space-y-6">
        {activeCode ? (
          <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-4 rounded-[2rem] shadow-[0_0_50px_rgba(79,70,229,0.3)]">
              <QRCodeSVG 
                value={activeCode.code_value} 
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Verification Token</p>
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase whitespace-pre">
                {activeCode.code_type === 'otp' ? activeCode.code_value : 'SCAN QR'}
              </h3>
            </div>

            <Button 
                variant="ghost" 
                size="sm"
                className="text-slate-500 hover:text-white gap-2 h-8 px-3 rounded-lg hover:bg-white/5 font-bold"
                onClick={() => generateCode(activeCode.code_type)}
                disabled={isGenerating}
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Refresh Code
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
              <QrCode className="w-10 h-10 text-slate-500" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 font-bold italic uppercase tracking-tighter">No Active Authorization</p>
                <p className="text-slate-500 text-xs mt-1 italic">Generate a session-code for pickup security.</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl gap-2 h-10 active:scale-95 transition-all"
                  onClick={() => generateCode('qr')}
                  disabled={isGenerating}
                >
                  Generate QR
                </Button>
                <Button 
                  variant="outline"
                  className="border-white/10 bg-slate-800 text-white font-black rounded-xl h-10 active:scale-95 transition-all"
                  onClick={() => generateCode('otp')}
                  disabled={isGenerating}
                >
                  Get OTP
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="w-full h-px bg-white/5" />
        <div className="flex gap-3 items-start bg-emerald-500/[0.03] p-4 rounded-2xl border border-emerald-500/5">
            <AlertCircle className="w-4 h-4 text-emerald-500/50 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed italic">
                Show this QR or share the OTP with school gate staff for secure student dismissal. Codes are valid for 30 minutes.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
