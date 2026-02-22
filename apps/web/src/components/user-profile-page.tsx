"use client";

import React, { useEffect, useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Key, 
  Camera,
  MapPin,
  Building2,
  BadgeCheck,
  Calendar,
  Lock,
  Globe,
  Clock
} from 'lucide-react';
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Label
} from '@schoolerp/ui';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

export function UserProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await apiClient('/auth/me');
        if (response.success) {
          setProfile(response.data);
          setFullName(response.data.full_name || '');
          setPhone(response.data.phone || '');
          setAddress(response.data.guardian_details?.address?.String || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiClient('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName,
          phone: phone,
          address: address
        })
      });
      if (response.success) {
        alert('Profile updated successfully!');
      } else {
        alert(`Failed: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const roleLabel = profile?.role?.replace('_', ' ') || user?.role?.replace('_', ' ') || 'User';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Profile Header - Glassmorphic */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/20 via-background to-background border border-indigo-500/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-48 h-48 text-indigo-500" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-indigo-500 shadow-xl shadow-indigo-500/20 flex items-center justify-center text-4xl font-bold text-white border-4 border-background overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (fullName || profile?.full_name || user?.name)?.[0] || 'U'
              )}
            </div>
            <input 
              type="file" 
              id="avatar-upload" 
              className="hidden" 
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                  const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/v1/files/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  const uploadData = await uploadRes.json();
                  
                  if (uploadData.url) {
                    await apiClient('/auth/me', {
                      method: 'PATCH',
                      body: JSON.stringify({ avatar_url: uploadData.url })
                    });
                    setProfile({ ...profile, avatar_url: uploadData.url });
                    alert('Avatar updated!');
                  }
                } catch (err) {
                  console.error('Upload failed', err);
                  alert('Avatar upload failed');
                }
              }}
            />
            <button 
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 text-white border-2 border-background hover:bg-indigo-700 transition-all shadow-lg"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {fullName || profile?.full_name || user?.name}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-semibold border border-indigo-500/20 capitalize">
                <BadgeCheck className="w-4 h-4 mr-1.5" />
                {roleLabel}
              </span>
              <span className="inline-flex items-center text-muted-foreground text-sm font-medium">
                <Building2 className="w-4 h-4 mr-1.5" />
                {profile?.employee_details?.department?.String || 'Academy'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="personal" className="rounded-lg">Personal Info</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg">Security & Privacy</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Identity Details</CardTitle>
                <CardDescription>Update your personal information and contact details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background/50 border-border/50 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue={profile?.email || user?.email} disabled className="bg-muted/30 border-border/50 cursor-not-allowed opacity-70" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="bg-background/50 border-border/50 focus:ring-indigo-500/20" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee Code</Label>
                    <Input id="employee_id" defaultValue={profile?.employee_details?.employee_code || 'N/A'} disabled className="bg-muted/30 border-border/50 opacity-70" />
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="address">Residential Address</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full home address" className="bg-background/50 border-border/50" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-6">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="ml-auto bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-600/20 px-8 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="w-4 h-4 mr-2 opacity-60" /> Joined on
                    </span>
                    <span className="text-sm font-semibold">Dec 2023</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/30">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-2 opacity-60" /> Attendance
                    </span>
                    <span className="text-sm font-semibold text-green-500">98.5%</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Shield className="w-4 h-4 mr-2 opacity-60" /> Account Status
                    </span>
                    <span className="text-sm font-semibold text-indigo-400">Verified</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-indigo-600/5 backdrop-blur-sm rounded-2xl overflow-hidden group">
                <CardHeader className="p-0">
                  <div className="bg-indigo-600/10 p-4 border-b border-indigo-500/10">
                    <CardTitle className="text-indigo-400 text-lg flex items-center">
                      <Globe className="w-4 h-4 mr-2" /> Digital Identity
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center border border-indigo-500/20 transition-transform group-hover:scale-110">
                    <BadgeCheck className="w-12 h-12 text-indigo-500" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your digital ID is valid and active for on-campus verification across all school facilities.
                  </p>
                  <Button variant="outline" size="sm" className="w-full border-indigo-500/20 hover:bg-indigo-500/10 rounded-lg">
                    View ID Card
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Security Settings</CardTitle>
              <CardDescription>Manage your password and multi-factor authentication.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/30">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-indigo-400" /> Password
                  </p>
                  <p className="text-xs text-muted-foreground">Change your password to keep your account secure.</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-lg">Change Password</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-background/40 border border-border/30">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center">
                    <Key className="w-4 h-4 mr-2 text-indigo-400" /> 2FA Authentication
                  </p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted p-1 px-2 rounded">Disabled</span>
                  <Button variant="outline" size="sm" className="rounded-lg">Enable 2FA</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity">
           <Card className="border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
             <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="w-6 h-6 opacity-30" />
                </div>
                <p className="text-sm">No recent activity found.</p>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
