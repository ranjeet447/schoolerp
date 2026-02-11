"use client"

import React, { useState } from 'react';
import { 
  GraduationCap, 
  School, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Hash, 
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from '@schoolerp/ui';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';

export default function OnboardingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Simple guard
  if (user && user.role !== 'super_admin') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-red-500">Access Denied</h1>
        <p className="text-slate-400">Only platform administrators can onboard new schools.</p>
      </div>
    );
  }
  const [tenantId, setTenantId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    domain: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/admin/tenants/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to onboard school');
      }

      const data = await response.json();
      setTenantId(data.tenant_id);
      setSuccess(true);
      toast.success('School onboarded successfully!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">School Onboarded Successfully</h1>
        <p className="text-slate-400 max-w-md mb-8">
          The new institution and its admin account have been created. 
          You can now provide these details to the school administrator.
        </p>
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-left mb-8">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500 text-sm">Tenant ID</span>
              <span className="text-white font-mono text-sm">{tenantId}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500 text-sm">Login Subdomain</span>
              <span className="text-indigo-400 font-bold">{formData.subdomain}.schoolerp.com</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500 text-sm">Admin Email</span>
              <span className="text-white">{formData.admin_email}</span>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => window.location.reload()} variant="outline" className="border-slate-800 text-slate-300">
          Onboard Another School
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-indigo-500" />
          Institution Onboarding
        </h1>
        <p className="text-slate-400 mt-2">Register a new school or university on the platform</p>
      </div>

      <form onSubmit={handleOnboard} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: School Identity */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-400">
                <School className="h-5 w-5" />
                School Identity
              </CardTitle>
              <CardDescription>Basic information for the new institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Institution Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className="pl-10 bg-slate-950 border-slate-800 text-white" 
                    placeholder="e.g. Oakridge International" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain (URL Segment)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
                    schoolerp.com/
                  </div>
                  <Input 
                    id="subdomain" 
                    name="subdomain" 
                    value={formData.subdomain} 
                    onChange={handleChange}
                    className="pl-28 bg-slate-950 border-slate-800 text-white" 
                    placeholder="oakridge" 
                    required 
                  />
                </div>
                <p className="text-[11px] text-slate-500">This will be the unique URL for this school</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain (Optional)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Globe className="h-4 w-4" />
                  </div>
                  <Input 
                    id="domain" 
                    name="domain" 
                    value={formData.domain} 
                    onChange={handleChange}
                    className="pl-10 bg-slate-950 border-slate-800 text-white" 
                    placeholder="e.g. portal.oakridge.edu" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Primary Administrator */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-400">
                <User className="h-5 w-5" />
                Administrative Account
              </CardTitle>
              <CardDescription>Setup the first school administrator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin_name">Admin Full Name</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <Input 
                    id="admin_name" 
                    name="admin_name" 
                    value={formData.admin_name} 
                    onChange={handleChange}
                    className="pl-10 bg-slate-950 border-slate-800 text-white" 
                    placeholder="John Doe" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email Address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input 
                    id="admin_email" 
                    name="admin_email" 
                    type="email"
                    value={formData.admin_email} 
                    onChange={handleChange}
                    className="pl-10 bg-slate-950 border-slate-800 text-white" 
                    placeholder="admin@school.edu.in" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_phone">Admin Phone Number</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input 
                    id="admin_phone" 
                    name="admin_phone" 
                    value={formData.admin_phone} 
                    onChange={handleChange}
                    className="pl-10 bg-slate-950 border-slate-800 text-white" 
                    placeholder="+91-XXXXX-XXXXX" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Hash className="h-4 w-4" />
                  </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password"
                    value={formData.password} 
                    onChange={handleChange}
                    className="pl-10 bg-slate-950 border-slate-800 text-white" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
          <div className="mr-8 hidden md:block text-right">
            <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Ready to Launch?</p>
            <p className="text-slate-500 text-xs">This will create the database entries immediately.</p>
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 text-md font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Confirm Onboarding
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
