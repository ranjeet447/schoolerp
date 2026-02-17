"use client";

import { useRouter } from 'next/navigation';
import { RBACService } from '@/lib/auth-service';
import { useLayoutEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useLayoutEffect(() => {
    const user = RBACService.getCurrentUser();
    if (!user || !user.role) {
      router.replace('/auth/login');
    } else {
      const redirect = RBACService.getDashboardPath(user.role);
      router.replace(redirect);
    }
  }, [router]);

  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Initializing Secure Session...</p>
      </div>
    </div>
  );
}
