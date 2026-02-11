"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  UserCircle, 
  Users, 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-react';
import { Button, Input } from '@schoolerp/ui';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Sign in successful! Redirecting...');
        // Redirection is handled by the root page or we can force it here
        router.push('/');
      } else {
        toast.error(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-3 backdrop-blur-xl shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl py-8 px-8 shadow-2xl rounded-3xl border border-white/10 ring-1 ring-white/5">
          <form className="space-y-6" onSubmit={handleLogin}>
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
                  placeholder="admin@school.edu.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  Password
                </label>
                <Link 
                  href="/auth/forget-password"
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 bg-slate-900/50 border-white/5 text-white placeholder:text-slate-600 focus:ring-indigo-500/50 focus:border-indigo-500/50 rounded-xl transition-all h-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest h-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-white/10" />
            <div className="relative flex justify-center uppercase">
              <span className="bg-slate-900 px-4 text-[10px] font-black text-slate-500 tracking-[0.3em]">
                Quick Access Portals
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button onClick={() => { setEmail('admin@school.edu.in'); }} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-center group cursor-pointer backdrop-blur-md">
              <div className="h-10 w-10 bg-slate-800 text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-slate-400 block tracking-widest uppercase group-hover:text-white transition-colors">Admin</span>
            </button>
            <button onClick={() => { setEmail('teacher@school.edu.in'); }} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-center group cursor-pointer backdrop-blur-md">
              <div className="h-10 w-10 bg-slate-800 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <UserCircle className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-slate-400 block tracking-widest uppercase group-hover:text-white transition-colors">Teacher</span>
            </button>
            <button onClick={() => { setEmail('parent@school.edu.in'); }} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-center group cursor-pointer backdrop-blur-md">
              <div className="h-10 w-10 bg-slate-800 text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black text-slate-400 block tracking-widest uppercase group-hover:text-white transition-colors">Parent</span>
            </button>
          </div>
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
