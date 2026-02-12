import React from 'react';
import { Container, Section, FinalCTA } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import {  ArrowLeft, Calendar, User } from 'lucide-react';

// Mock data
export async function generateStaticParams() {
  return [
    { slug: 'multilingual-support' },
    { slug: 'fee-collection-strategies' },
    { slug: 'audit-logs-explained' }
  ];
}

const POSTS = {
  'multilingual-support': {
    title: 'Why Regional Language Support is Critical for Indian Schools',
    date: 'Jan 28, 2026',
    author: 'Ranjeet Kumar',
    content: `
      <p>English is often the medium of instruction in Indian classrooms, but the administrative reality works differently. From the school gatekeeper to the bus driver, and often the parents themselves, communication happens in vernacular languages.</p>
      
      <h3>The Disconnect</h3>
      <p>Most School ERPs are built with a Western-first mindset, offering only English interfaces. This leads to:</p>
      <ul>
        <li>Staff resistance to using the software.</li>
        <li>Data entry errors due to language barriers.</li>
        <li>Parents ignoring important notifications sent in English.</li>
      </ul>

      <h3>Our Approach</h3>
      <p>We built School ERP with a localization-first architecture. Every button, every label, and every report can be toggled between English, Hindi, Marathi, Telugu, and 8 other languages instantly.</p>
    `
  },
  'fee-collection-strategies': {
     title: '5 Strategies to Reduce Fee Defaults by 40%',
     date: 'Jan 15, 2026',
     author: 'Finance Team',
     content: `
       <p>Cash flow is the lifeblood of any private school. Yet, most schools face a 15-20% default rate every quarter.</p>
       <p>Implementing automated reminders and easier payment gateways can significantly reduce friction.</p>
     `
  },
  'audit-logs-explained': {
      title: 'Understanding Audit Logs: A Guide for Principals',
      date: 'Jan 10, 2026',
      author: 'Security Team',
      content: `
        <p>Data integrity is paramount. An audit log tracks every single change made to your database.</p>
      `
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS[slug as keyof typeof POSTS];
  return {
    title: post ? `${post.title} - School ERP Blog` : 'Blog Post',
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug as keyof typeof POSTS];

  if (!post) return <div>Post not found</div>;

  return (
    <main>
       <Section>
         <Container size="small">
            <Link href="/blog" className="mb-8 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to blog
            </Link>

            <header className="mb-10 text-center">
               <div className="mb-4 flex justify-center gap-4 text-sm text-muted-foreground">
                 <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {post.date}</span>
                 <span className="flex items-center gap-1"><User className="h-4 w-4" /> {post.author}</span>
               </div>
               <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">{post.title}</h1>
            </header>

            <article className="prose prose-slate dark:prose-invert lg:prose-lg mx-auto">
               <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            <div className="mt-16 border-t pt-8">
               <p className="font-medium italic text-muted-foreground">
                 "School ERP has transformed how we manage our operations."
               </p>
            </div>
         </Container>
       </Section>
       <FinalCTA />
    </main>
  );
}
