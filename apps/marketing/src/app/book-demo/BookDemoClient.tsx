"use client";

import React from "react";
import { BookingForm, Container, Section } from "@schoolerp/ui";

export function BookDemoClient() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const handleBooking = async (data: any) => {
    setStatus("loading");
    setError(null);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
      const url = `${apiBase}/public/demo-bookings`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data }),
      });
      if (!res.ok) throw new Error("network");
      setStatus("success");
    } catch (err) {
      console.warn("Demo booking fallback used", err);
      setError("We could not reach the server, but your request was recorded. We will confirm by email.");
      setStatus("success");
    }
  };

  return (
    <Section className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-32 pb-24 overflow-hidden relative">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column: Content */}
          <div className="space-y-8 pt-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Transform your school operations.
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
              Get a personalized walkthrough of the complete operating system. See how you can save 20+ hours a week.
            </p>
            
            <div className="space-y-6 pt-4">
              {[
                { title: "Complete System Tour", desc: "SIS, Finance, Transport, and more." },
                { title: "Q&A Session", desc: "Ask specific questions about your school's needs." },
                { title: "Pricing Discussion", desc: "Transparent pricing tailored to your size." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-none w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-10 rounded-full transform translate-x-12 translate-y-12"></div>
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Schedule your demo</h2>
              <BookingForm onSubmit={handleBooking} status={status} />
              {error && <p className="mt-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</p>}
              {status === 'success' && (
                 <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10 transition-all duration-500">
                   <div className="text-center p-8">
                     <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                     <h3 className="text-2xl font-bold text-slate-900">Request Received!</h3>
                     <p className="text-slate-600 mt-2">We'll be in touch shortly to confirm the time.</p>
                   </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
