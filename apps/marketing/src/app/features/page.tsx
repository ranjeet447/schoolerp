import React from 'react';
import { FinalCTA, OrganizationSchema } from '@schoolerp/ui';
import { Metadata } from 'next';
import { FeaturesClient } from './FeaturesClient';

export const metadata: Metadata = {
  title: 'School ERP Features - Modules for Every Requirement',
  description: 'Explore our 20+ school management modules including fee collection, attendance mapping, digital report cards, and parent communication tools.',
  alternates: {
    canonical: 'https://schoolerp.com/features'
  }
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
