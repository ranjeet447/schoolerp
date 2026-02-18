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
import { apiClient } from '@/lib/api-client';

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to process password reset request');
      }

      setSubmitted(true);
      toast.success('If your account exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process password reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen aurora-bg flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link 
          href="/auth/login"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex items-center justify-center p-3 shadow-2xl">
            <KeyRound className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-foreground tracking-tight">
          Retrieve Password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your email address and we'll send you a recovery link
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-card/80 backdrop-blur-2xl py-8 px-8 shadow-2xl rounded-3xl border border-border">
          {!submitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 rounded-xl transition-all h-12"
                    placeholder="you@school.edu.in"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.18)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 group"
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
              <h3 className="text-foreground font-bold mb-2">Check your inbox</h3>
              <p className="text-muted-foreground text-sm mb-6">
                We've sent a password reset link to <span className="text-primary font-bold">{email}</span>.
              </p>
              <Link 
                href="/auth/login"
                className="text-primary hover:text-primary/80 font-black uppercase tracking-widest text-xs"
              >
                Return to sign in
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            SchoolERP &bull; Precision &bull; Performance &bull; Power
          </p>
        </div>
      </div>
    </div>
  );
}
