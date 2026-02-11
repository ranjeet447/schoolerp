"use client";

import { 
  ShieldCheck, 
  UserCircle, 
  Users, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center p-3 backdrop-blur-xl shadow-2xl group">
            <ShieldCheck className="h-10 w-10 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">
          Access Your Portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Select your destination to sign in to the SchoolERP platform
        </p>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <Link 
          href="/auth/login"
          className="group relative bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 transition-all shadow-xl flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-indigo-400 translate-x-4 group-hover:translate-x-0 transition-transform" />
          </div>
          <div className="h-16 w-16 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shadow-lg">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide uppercase mb-2">School Admin</h3>
          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            Manage your institution, staff, and overall operations
          </p>
        </Link>

        <Link 
          href="/auth/login"
          className="group relative bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all shadow-xl flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-emerald-400 translate-x-4 group-hover:translate-x-0 transition-transform" />
          </div>
          <div className="h-16 w-16 bg-slate-900 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300 shadow-lg">
            <UserCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide uppercase mb-2">Teacher Hub</h3>
          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            Access classes, attendance, marks, and student profiles
          </p>
        </Link>

        <Link 
          href="/auth/login"
          className="group relative bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all shadow-xl flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-purple-400 translate-x-4 group-hover:translate-x-0 transition-transform" />
          </div>
          <div className="h-16 w-16 bg-slate-900 text-purple-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-lg">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide uppercase mb-2">Parent Portal</h3>
          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            Track child progress, pay fees, and stay updated
          </p>
        </Link>

        <Link 
          href="/auth/login"
          className="group relative bg-white/5 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 hover:border-rose-500/50 hover:bg-white/10 transition-all shadow-xl flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-5 w-5 text-rose-400 translate-x-4 group-hover:translate-x-0 transition-transform" />
          </div>
          <div className="h-16 w-16 bg-slate-900 text-rose-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-lg">
            <ArrowLeft className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-white tracking-wide uppercase mb-2">Employee Ops</h3>
          <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
            HRMS, payroll, and personal operational tasks
          </p>
        </Link>
      </div>

      <div className="mt-12 text-center relative z-10">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.4em] mb-4">
          SchoolERP Ecosystem
        </p>
        <div className="flex justify-center gap-8">
          <div className="h-1 bg-indigo-500/30 w-12 rounded-full" />
          <div className="h-1 bg-slate-800 w-12 rounded-full" />
          <div className="h-1 bg-slate-800 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
