"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button, Input } from "@schoolerp/ui";
import { toast } from "sonner";
import Link from "next/link";
import { RBACService } from "@/lib/auth-service";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await RBACService.resetPassword(token, password);
      if (result.success) {
        setSubmitted(true);
        toast.success("Password reset successful");
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-slate-100">
              Success!
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
          </div>
          <div className="mt-6">
            <Link href="/auth/login">
              <Button className="w-full rounded-2xl py-6 font-bold uppercase tracking-widest italic group">
                Return to Login
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
            <ShieldCheck className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-slate-100">
            Reset <span className="text-indigo-600">Password</span>
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Choose a strong password to secure your account.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl bg-amber-50 p-6 text-center border border-amber-100/50 dark:bg-amber-950/20 dark:border-amber-900/30">
            <AlertCircle className="mx-auto h-8 w-8 text-amber-600 mb-4" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
              No reset token found. Please use the link sent to your email or request a new one.
            </p>
            <Link href="/auth/forget-password" translate="no">
              <Button variant="outline" className="mt-4 w-full rounded-xl border-amber-200 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400">
                Request New Link
              </Button>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-2xl pl-12 h-14 bg-slate-50 border-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <Lock className="absolute left-4 top-[42px] h-5 w-5 text-slate-400" />
              </div>
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-2xl pl-12 h-14 bg-slate-50 border-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
                <Lock className="absolute left-4 top-[42px] h-5 w-5 text-slate-400" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-2xl py-6 font-bold uppercase tracking-widest italic group h-14"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Update Password
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
