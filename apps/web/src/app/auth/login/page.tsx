"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RBACService } from '@/lib/auth-service';
import { 
  ShieldCheck, 
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

  useEffect(() => {
    const user = RBACService.getCurrentUser();
    if (user && user.role) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Sign in successful! Redirecting...');
        // Redirection is handled by the root page or we can force it here
        router.push('/');
      } else if (result.redirect) {
        router.push(result.redirect);
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
    <div className="min-h-screen aurora-bg flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Abstract Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex items-center justify-center p-3 shadow-2xl">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-foreground tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-card/80 backdrop-blur-2xl py-8 px-8 shadow-2xl rounded-3xl border border-border">
          <form className="space-y-6" onSubmit={handleLogin}>
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
                  placeholder="admin@school.edu.in"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest">
                  Password
                </label>
                <Link 
                  href="/auth/forget-password"
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 rounded-xl transition-all h-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.18)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] transition-all flex items-center justify-center gap-2 group"
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
