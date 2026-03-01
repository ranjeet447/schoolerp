import React from 'react';
import { FinalCTA, OrganizationSchema } from '@schoolerp/ui';
import { Metadata } from 'next';
import { FeaturesClient } from './FeaturesClient';

export const metadata: Metadata = {
  title: 'School ERP Features | Fee Collection, Parent App, Attendance & Exams',
  description: 'Explore school fee management software, parent communication app features, attendance management (biometric-ready), exam management, results, and report card software for schools.',
  keywords: [
    'school fee management software',
    'school fee collection software',
    'parent communication app for schools',
    'school attendance management system',
    'biometric attendance for schools',
    'exam management software for schools',
    'report card software for schools'
  ],
  alternates: {
    canonical: 'https://schoolerp.com/features'
  },
  openGraph: {
    title: 'School ERP Features for Schools',
    description: 'Compare SchoolERP features by fee collection, parent communication, attendance, exams/report cards, and advanced modules.',
    url: 'https://schoolerp.com/features',
  },
};

export default function FeaturesPage() {
  return (
    <main>
      <OrganizationSchema />
      <FeaturesClient />
      <FinalCTA />
    </main>
  );
}
