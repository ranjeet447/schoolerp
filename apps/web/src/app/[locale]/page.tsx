import Link from 'next/link';
import { 
  Users, 
  GraduationCap, 
  School,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@schoolerp/ui';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <nav className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-2xl text-blue-600">
            <School className="h-8 w-8" />
            <span>SchoolERP</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <span>Release 1.0</span>
            <Link href="/auth">
              <Button variant="outline" size="sm" className="font-bold border-blue-200 text-blue-600 hover:bg-blue-50">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-6xl mb-6">
            School Management <span className="text-blue-600">Operating System</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to the future of school administration. Choose your portal below to access student information, 
            attendance, finances, and communication tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {/* Admin Portal */}
          <Card className="hover:shadow-xl transition-all border-2 hover:border-blue-500/50 group bg-white">
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
              <CardDescription className="text-base">Full system control & SIS</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 my-8 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 
                  Student Management
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 
                  Fee Collection
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> 
                  System Settings
                </li>
              </ul>
              <Link href="/students" className="block w-full">
                <Button className="w-full h-12 text-base font-semibold gap-2 group shadow-md hover:shadow-lg">
                  Enter Admin <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Teacher Portal */}
          <Card className="hover:shadow-xl transition-all border-2 hover:border-emerald-500/50 group bg-white">
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm">
                <LayoutDashboard className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold">Teacher Portal</CardTitle>
              <CardDescription className="text-base">Academic & Attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 my-8 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                  Digital Attendance
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                  Grade Entry
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                  Class Management
                </li>
              </ul>
              <Link href="/teacher/attendance" className="block w-full">
                <Button variant="outline" className="w-full h-12 text-base font-semibold gap-2 group border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 shadow-sm">
                  Enter Teacher <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Parent Portal */}
          <Card className="hover:shadow-xl transition-all border-2 hover:border-purple-500/50 group bg-white">
            <CardHeader className="text-center pb-2">
              <div className="h-20 w-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                <Users className="h-10 w-10" />
              </div>
              <CardTitle className="text-2xl font-bold">Parent Portal</CardTitle>
              <CardDescription className="text-base">Child Progress & Payments</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4 my-8 text-sm text-slate-600 font-medium">
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> 
                  Online Fee Payment
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> 
                  Performance Reports
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> 
                  School Notifications
                </li>
              </ul>
              <Link href="/parent/fees" className="block w-full">
                <Button variant="outline" className="w-full h-12 text-base font-semibold gap-2 group border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-500 shadow-sm">
                  Enter Parent <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-12 bg-white border-t text-center text-slate-500 text-sm">
        <p className="mb-2">&copy; 2026 SchoolERP - Enterprise Cloud Platform for Education</p>
        <p className="text-xs uppercase tracking-widest text-slate-400">Powered by Next.js & Go</p>
      </footer>
    </div>
  );
}
