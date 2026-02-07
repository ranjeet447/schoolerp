"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { Check } from 'lucide-react';

interface ContactFormProps {
  onSubmit: (data: any) => Promise<void>;
  status?: 'idle' | 'loading' | 'success' | 'error';
}

export const ContactForm = ({ onSubmit, status = 'idle' }: ContactFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school_name: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (status === 'success') {
    return (
      <div className="rounded-[2.5rem] bg-emerald-500/10 p-12 text-center border border-emerald-500/20 backdrop-blur-3xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 shadow-2xl shadow-emerald-500/40 text-white mb-8">
           <Check className="h-10 w-10" />
        </div>
        <h3 className="text-3xl font-black text-white">Transmission Received</h3>
        <p className="mt-4 text-emerald-400 font-medium">Our tactical response team will be in touch within 2 business hours.</p>
      </div>
    );
  }

  const inputClasses = "block w-full rounded-2xl border-white/10 bg-white/5 px-6 py-4 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm font-bold placeholder:text-slate-500 transition-all focus:bg-white/10";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
        <div className="space-y-3">
          <label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="John Doe"
            required
            className={inputClasses}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label htmlFor="school_name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
            School Name
          </label>
          <input
            type="text"
            name="school_name"
            id="school_name"
            placeholder="Heritage World School"
            required
            className={inputClasses}
            value={formData.school_name}
            onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
            Official Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="john@school.com"
            required
            className={inputClasses}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-3">
          <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            placeholder="+91 98XXX XXXXX"
            required
            className={inputClasses}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 space-y-3">
          <label htmlFor="message" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">
            Executive Message
          </label>
          <textarea
            name="message"
            id="message"
            rows={4}
            placeholder="How can we help you transform your institution?"
            className={inputClasses}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>
      </div>
      <div className="mt-12">
        <Button
          type="submit"
          size="lg"
          className="w-full h-16 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Encrypting & Sending...' : 'Request Priority Demo'}
        </Button>
      </div>
    </form>
  );
};
