"use client";

import { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Loader2,
  ChevronLeft,
  KeyRound
} from 'lucide-react';
import { Button, Input } from '@schoolerp/ui';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock functionality for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setLoading(false);
    toast.success('Reset link sent to your email!');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link 
          href="/auth/login"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-8 text-sm group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-3 backdrop-blur-xl shadow-2xl">
            <KeyRound className="h-10 w-10 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight">
          Retrieve Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your email address and we'll send you a recovery link
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl py-8 px-8 shadow-2xl rounded-3xl border border-white/10 ring-1 ring-white/5">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 bg-slate-900/50 border-white/5 text-white placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500/50 rounded-xl transition-all h-12"
                    placeholder="you@school.edu.in"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Send Reset Link <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="h-12 w-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-white font-bold mb-2">Check your inbox</h3>
              <p className="text-slate-400 text-sm mb-6">
                We've sent a password reset link to <span className="text-indigo-400 font-bold">{email}</span>.
              </p>
              <Link 
                href="/auth/login"
                className="text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest text-xs"
              >
                Return to sign in
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            SchoolERP &bull; Precision &bull; Performance &bull; Power
          </p>
        </div>
      </div>
    </div>
  );
}
