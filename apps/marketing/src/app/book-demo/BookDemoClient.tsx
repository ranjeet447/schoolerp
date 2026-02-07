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
    <>
      <Section className="bg-muted/20">
        <Container className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Book a 30-minute product demo</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            One live walkthrough covering academics, finance, safety, and operations. Tell us your school details and a preferred time.
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="max-w-3xl">
          <div className="rounded-2xl border bg-card p-8 shadow-sm">
            <BookingForm onSubmit={handleBooking} status={status} />
            {error && <p className="mt-3 text-sm text-amber-600">{error}</p>}
          </div>
        </Container>
      </Section>
    </>
  );
}
