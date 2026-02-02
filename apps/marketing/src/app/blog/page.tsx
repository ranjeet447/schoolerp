import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog - School ERP Insights',
  description: 'Latest updates, guides, and insights on school management and edtech.',
};

// Mock data replacing file-system read for now
const POSTS = [
  {
    slug: 'multilingual-support',
    title: 'Why Regional Language Support is Critical for Indian Schools',
    excerpt: 'English is the medium of instruction, but administration happens in Hindi, Marathi, and Tamil. Here is why your ERP needs to speak local languages.',
    date: 'Jan 28, 2026',
    readTime: '5 min read',
    author: 'Ranjeet Kumar',
    category: 'Product'
  },
  {
    slug: 'fee-collection-strategies',
    title: '5 Strategies to Reduce Fee Defaults by 40%',
    excerpt: 'Automated reminders, UPI integration, and partial payment workflows can drastically improve your cash flow.',
    date: 'Jan 15, 2026',
    readTime: '8 min read',
    author: 'Finance Team',
    category: 'Finance'
  },
  {
    slug: 'audit-logs-explained',
    title: 'Understanding Audit Logs: A Guide for Principals',
    excerpt: 'Who changed that student record? Why is the fee ledger different? Audit logs answer the "who, when, and what" of school data safety.',
    date: 'Jan 10, 2026',
    readTime: '4 min read',
    author: 'Security Team',
    category: 'Security'
  }
];

export default function BlogListingPage() {
  return (
    <main>
      <div className="pt-24 pb-12 bg-muted/20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Insights & Updates</h1>
        <p className="mt-4 text-xl text-muted-foreground mx-auto max-w-2xl">
          Best practices for modern school administration.
        </p>
      </div>

      <Section>
        <Container size="default">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {POSTS.map((post) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:border-primary/50"
              >
                <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
                  {/* Placeholder for blog image */}
                  <span className="text-sm font-medium">Cover Image</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {post.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  </div>
                  <h2 className="mb-3 text-xl font-bold leading-tight group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mb-6 flex-1 text-sm text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    Read Article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <FinalCTA />
    </main>
  );
}
