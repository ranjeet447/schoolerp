"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  School, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  UserCircle,
  Users,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Label 
} from '@schoolerp/ui';
import Link from 'next/link';
import { RBACService } from '@/lib/auth-service';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Real Login via Backend API
      const result = await RBACService.login(email, password);

      if (result.success && result.redirect) {
        toast.success(`Welcome back! Redirecting to ${result.role} portal...`);
        router.push(result.redirect);
      } else {
        toast.error(result.error || "Invalid credentials. Check email and password.");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 aurora-bg font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Left Side: Visual/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-12 bg-slate-900/40 backdrop-blur-sm">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 max-w-lg text-center"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md shadow-lg shadow-indigo-500/10">
            <span className="h-2 w-2 bg-indigo-400 rounded-full animate-ping" />
            <span className="text-indigo-200 text-xs font-bold tracking-widest uppercase">Trusted by 500+ Institutions</span>
          </div>
          
          <h2 className="text-5xl font-black text-white tracking-tight mb-8 leading-tight text-glow">
            The Operating System <br />
            for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 underline decoration-indigo-500/30 underline-offset-8">Growth-Minded</span> Schools.
          </h2>
          
          <div className="space-y-6 text-left inline-block mx-auto">
            {[
              'Enterprise-grade security protocols',
              'Real-time data synchronization',
              'Multi-tenant architecture isolation'
            ].map((text) => (
              <div key={text} className="flex items-center gap-4 text-slate-400 group">
                <div className="h-10 w-10 flex-shrink-0 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="font-semibold text-sm tracking-wide group-hover:text-slate-200 transition-colors">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Floating Credit Card Mock (Aesthetic) */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [-12, -10, -12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-5%] left-[5%] w-72 h-96 glass-dark rounded-[2.5rem] p-8 -rotate-12 opacity-60 border-white/10 hidden lg:block shadow-2xl"
        >
          <div className="h-12 w-12 bg-white/10 rounded-2xl mb-8" />
          <div className="space-y-4">
            <div className="h-3 bg-white/10 rounded-full w-full" />
            <div className="h-3 bg-white/10 rounded-full w-3/4" />
            <div className="h-3 bg-white/5 rounded-full w-5/6 mt-8" />
          </div>
        </motion.div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-16 relative bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-3 mb-10 group">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
                <School className="h-6 w-6" />
              </div>
              <span className="font-extrabold text-2xl tracking-tighter text-white">
                School<span className="text-indigo-400">ERP</span>
              </span>
            </Link>
            <h1 className="text-4xl font-black text-white tracking-tight mb-3">Sign In</h1>
            <p className="text-slate-400 font-medium">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 font-bold tracking-tight text-sm">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.edu.in" 
                  className="pl-12 h-14 bg-slate-800/50 border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-2xl font-semibold placeholder:text-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300 font-bold tracking-tight text-sm">
                  Password
                </Label>
                <Link href="#" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="pl-12 h-14 bg-slate-800/50 border-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all rounded-2xl font-semibold placeholder:text-slate-600 text-white"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 text-lg font-bold gap-3 group shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:bg-indigo-500 transition-all mt-6 rounded-2xl bg-white text-slate-900 hover:text-white disabled:opacity-70"
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

          <p className="mt-12 text-center text-sm text-slate-500 font-medium tracking-tight">
            Don't have an account?{' '}
            <Link href="https://schoolerp-marketing.vercel.app/pricing" className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4 transition-colors">
              Register your school
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
