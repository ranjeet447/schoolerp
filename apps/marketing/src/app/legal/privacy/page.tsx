import React from 'react';
import { Container, Section } from '@schoolerp/ui';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - School ERP',
  description: 'How we handle your data with enterprise-grade security.',
};

export default function PrivacyPage() {
  return (
    <main>
      <div className="pt-32 pb-12 bg-muted/20 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: Jan 01, 2026</p>
      </div>

      <Section>
        <Container size="small" className="prose prose-slate dark:prose-invert lg:prose-lg mx-auto">
          <h2>1. Data Protection</h2>
          <p>
            We take your school's data security seriously. All student records, fee data, and communication logs 
            are encrypted at rest using AES-256 and in transit using TLS 1.3.
          </p>

          <h2>2. No Data Selling</h2>
          <p>
            School ERP is a paid software service. We do not sell, rent, or trade your student data to 
            advertisers, educational publishers, or any third parties. Your data belongs to your school.
          </p>

          <h2>3. Data Access</h2>
          <p>
            Our support engineers access your data only when explicitly authorized by your school admin 
            via a support ticket. All access is logged in the audit trail.
          </p>
          
          <h2>4. Contact Us</h2>
          <p>
            For privacy-related inquiries, please contact our Data Protection Officer at privacy@schoolerp.com.
          </p>
        </Container>
      </Section>
    </main>
  );
}
