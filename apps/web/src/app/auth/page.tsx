import React from 'react';
import { 
  School, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  UserCircle,
  Users
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@schoolerp/ui';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 font-bold text-3xl text-blue-600 mb-2">
            <School className="h-10 w-10" />
            <span>SchoolERP</span>
          </div>
          <p className="text-slate-500 font-medium">Enterprise School Management</p>
        </div>

        <Card className="shadow-2xl border-0 ring-1 ring-slate-200">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <CardDescription className="text-base text-slate-500">
              Enter your credentials to access your portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold tracking-wide">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@school.edu.in" 
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 font-semibold tracking-wide">
                    Password
                  </Label>
                  <Link href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl"
                  />
                </div>
              </div>

              <Link href="/students">
                <Button className="w-full h-12 text-base font-bold gap-2 group shadow-lg hover:shadow-blue-500/25 transition-all mt-4 bg-blue-600 hover:bg-blue-700">
                  Sign In <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-slate-200" />
              <div className="relative flex justify-center uppercase">
                <span className="bg-white px-3 text-xs font-bold text-slate-400 tracking-widest">
                  Quick Access
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Link href="/students" className="p-3 border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all text-center group">
                <div className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">ADMIN</span>
              </Link>
              <Link href="/teacher/attendance" className="p-3 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all text-center group">
                <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <UserCircle className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">TEACHER</span>
              </Link>
              <Link href="/parent/fees" className="p-3 border border-slate-100 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all text-center group">
                <div className="h-8 w-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 block">PARENT</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          Don't have an account?{' '}
          <Link href="https://schoolerp-marketing.vercel.app/pricing" className="text-blue-600 hover:text-blue-700 font-bold underline underline-offset-4">
            Register your school
          </Link>
        </p>
      </div>
    </div>
  );
}
