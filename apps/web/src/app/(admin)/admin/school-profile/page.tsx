"use client";

import React, { useEffect, useState } from "react";
import { Button, Input } from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { Building, Save, Globe, MapPin, Phone, Mail, GraduationCap, Clock } from "lucide-react";

interface Profile {
  school_name: string;
  logo_url: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  affiliation_board: string;
  affiliation_number: string;
  timezone: string;
  academic_year_format: string;
  grading_system: string;
}

const BOARDS = ["CBSE", "ICSE", "ISC", "State Board", "IB", "Cambridge", "Other"];
const GRADING_SYSTEMS = ["percentage", "grade", "cgpa"];
const TIMEZONES = ["Asia/Kolkata", "Asia/Colombo", "Asia/Dhaka", "Asia/Kathmandu", "Asia/Dubai"];

export default function SchoolProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    school_name: "", logo_url: "", address: "", city: "", state: "", pincode: "",
    phone: "", email: "", website: "", affiliation_board: "CBSE", affiliation_number: "",
    timezone: "Asia/Kolkata", academic_year_format: "YYYY-YYYY", grading_system: "percentage",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient("/admin/school-profile");
        if (res.ok) {
          const data = await res.json();
          // Merge with defaults
          setProfile(prev => ({ ...prev, ...data }));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await apiClient("/admin/school-profile", {
        method: "PUT", body: JSON.stringify(profile),
      });
      if (res.ok) setSaved(true);
    } catch (e) { console.error(e); }
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const update = (key: keyof Profile, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">School Profile</h1>
          <p className="text-slate-400 font-medium">Configure school identity, contact details, and academic settings.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl px-6">
          {saving ? "Saving…" : saved ? "✓ Saved!" : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
        </Button>
      </div>

      {/* School Identity */}
      <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <Building className="h-5 w-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">School Identity</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-400 mb-1 block">School Name</label>
            <Input value={profile.school_name} onChange={e => update("school_name", e.target.value)}
              placeholder="Delhi Public School" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Logo URL</label>
            <Input value={profile.logo_url} onChange={e => update("logo_url", e.target.value)}
              placeholder="https://..." className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={profile.website} onChange={e => update("website", e.target.value)}
                placeholder="www.school.edu.in" className="bg-slate-800/50 border-white/5 text-white rounded-xl pl-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Contact & Address</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-bold text-slate-400 mb-1 block">Address</label>
            <Input value={profile.address} onChange={e => update("address", e.target.value)}
              placeholder="123 School Road" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">City</label>
            <Input value={profile.city} onChange={e => update("city", e.target.value)}
              placeholder="New Delhi" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">State</label>
            <Input value={profile.state} onChange={e => update("state", e.target.value)}
              placeholder="Delhi" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Pincode</label>
            <Input value={profile.pincode} onChange={e => update("pincode", e.target.value)}
              placeholder="110001" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={profile.phone} onChange={e => update("phone", e.target.value)}
                placeholder="+91 11 23456789" className="bg-slate-800/50 border-white/5 text-white rounded-xl pl-10" />
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input value={profile.email} onChange={e => update("email", e.target.value)}
                placeholder="info@school.edu.in" className="bg-slate-800/50 border-white/5 text-white rounded-xl pl-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Academic Settings */}
      <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">Academic Settings</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Affiliation Board</label>
            <select value={profile.affiliation_board} onChange={e => update("affiliation_board", e.target.value)}
              className="w-full h-10 px-3 bg-slate-800/50 border border-white/5 text-white rounded-xl">
              {BOARDS.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Affiliation Number</label>
            <Input value={profile.affiliation_number} onChange={e => update("affiliation_number", e.target.value)}
              placeholder="2730XXX" className="bg-slate-800/50 border-white/5 text-white rounded-xl" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Grading System</label>
            <select value={profile.grading_system} onChange={e => update("grading_system", e.target.value)}
              className="w-full h-10 px-3 bg-slate-800/50 border border-white/5 text-white rounded-xl capitalize">
              {GRADING_SYSTEMS.map(g => <option key={g} value={g} className="bg-slate-900 capitalize">{g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-400 mb-1 block">Timezone</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <select value={profile.timezone} onChange={e => update("timezone", e.target.value)}
                className="w-full h-10 pl-10 px-3 bg-slate-800/50 border border-white/5 text-white rounded-xl">
                {TIMEZONES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
