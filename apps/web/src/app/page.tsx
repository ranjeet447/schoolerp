"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Users, 
  GraduationCap, 
  School,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@schoolerp/ui';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Home() {
  return (
    <div className="min-h-screen aurora-bg flex flex-col font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-6"
      >
        <div className="max-w-7xl mx-auto glass-dark rounded-full px-6 py-3 flex justify-between items-center bg-slate-900/40 border-white/5 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
              <School className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              School<span className="text-indigo-400">ERP</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 text-indigo-300 rounded-full text-xs font-bold ring-1 ring-white/10">
              <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
              <span>V5.0 LIVE</span>
            </div>
            <Link href="/auth">
              <Button className="font-bold px-6 bg-white text-slate-900 hover:bg-indigo-50 hover:scale-105 transition-all rounded-full h-10 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <main className="flex-1 flex flex-col items-center justify-center relative pt-32 pb-20 px-6 w-full max-w-7xl mx-auto">
        
        {/* Floating Abstract Elements */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20 relative z-10 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 rounded-full text-indigo-300 text-xs font-bold tracking-widest uppercase mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            The Operating System for Education
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9] text-glow">
            Building the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-purple-300">
              Future of Learning.
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            A unified, high-performance platform for next-gen institutions. <br className="hidden md:block"/>
            Everything you need. Nothing you don't.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10"
        >
          {/* Admin Portal */}
          <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="h-full">
            <Link href="/students" className="block h-full">
              <div className="group relative h-full glass-card rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-full bg-slate-900/50 rounded-[1.3rem] p-8 flex flex-col items-center text-center border border-white/5 group-hover:bg-slate-900/40 transition-colors">
                  <div className="h-20 w-20 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:text-white group-hover:border-indigo-500/50 transition-all duration-300 shadow-xl">
                    <ShieldCheck className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Admin OS</h3>
                  <p className="text-slate-400 text-sm font-medium mb-8">Full Control & Analytics</p>
                  
                  <div className="mt-auto w-full">
                    <span className="flex items-center justify-center gap-2 text-indigo-400 text-sm font-bold group-hover:text-white transition-colors">
                      Access Dashboard <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Teacher Portal */}
          <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="h-full">
            <Link href="/teacher/attendance" className="block h-full">
              <div className="group relative h-full glass-card rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-full bg-slate-900/50 rounded-[1.3rem] p-8 flex flex-col items-center text-center border border-white/5 group-hover:bg-slate-900/40 transition-colors">
                  <div className="h-20 w-20 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 group-hover:text-white group-hover:border-emerald-500/50 transition-all duration-300 shadow-xl">
                    <LayoutDashboard className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Teacher App</h3>
                  <p className="text-slate-400 text-sm font-medium mb-8">Classroom Management</p>
                  
                  <div className="mt-auto w-full">
                    <span className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold group-hover:text-white transition-colors">
                      Enter Portal <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Parent Portal */}
          <motion.div variants={itemVariants} whileHover={{ y: -10 }} className="h-full">
            <Link href="/parent/fees" className="block h-full">
              <div className="group relative h-full glass-card rounded-3xl p-1 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative h-full bg-slate-900/50 rounded-[1.3rem] p-8 flex flex-col items-center text-center border border-white/5 group-hover:bg-slate-900/40 transition-colors">
                  <div className="h-20 w-20 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 group-hover:text-white group-hover:border-purple-500/50 transition-all duration-300 shadow-xl">
                    <Users className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Parent Connect</h3>
                  <p className="text-slate-400 text-sm font-medium mb-8">Fees & Progress</p>
                  
                  <div className="mt-auto w-full">
                    <span className="flex items-center justify-center gap-2 text-purple-400 text-sm font-bold group-hover:text-white transition-colors">
                      View Profile <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

        </motion.div>
      </main>

      <footer className="py-8 text-center w-full border-t border-white/5">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          &copy; 2026 SchoolERP Systems &bull; <Link href="/auth" className="hover:text-white transition-colors">Staff Login</Link>
        </p>
      </footer>
    </div>
  );
}
