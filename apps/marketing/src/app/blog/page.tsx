import React from 'react';
import { Container, Section, FinalCTA, BLOG_POSTS_DATA, Breadcrumbs } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog - School ERP Guides & Insights for Indian Schools',
  description: 'Actionable strategies, feature updates, and best practices for managing modern Indian private schools.',
  alternates: {
    canonical: 'https://schoolerp.com/blog',
  }
};

export default function BlogListingPage() {
  return (
    <main>
      <div className="pt-32 pb-16 bg-muted/20 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <Container className="relative z-10">
          <Breadcrumbs items={[{ label: 'Blog' }]} />
          
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary mb-8 shadow-sm">
            <Sparkles className="h-4 w-4" /> Best Practices
          </div>
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl leading-[0.95] mb-6">Guides & Insights</h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium mx-auto max-w-2xl leading-relaxed">
            Actionable strategies and updates for modern Indian private school administration.
          </p>
        </Container>
      </div>

      <Section className="bg-background pt-16 border-t border-border/50">
        <Container size="default">
          <div className="flex items-center justify-between mb-10 border-b pb-6">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {['All', 'Finance', 'Academics', 'Admissions', 'Operations', 'Communication'].map((cat) => (
                <span key={cat} className={`text-sm font-bold px-4 py-2 rounded-full cursor-pointer transition-colors shrink-0 ${cat === 'All' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/50'}`}>
                  {cat === 'All' ? 'All Articles' : cat}
                </span>
              ))}
            </div>
            <div className="text-sm font-medium text-muted-foreground hidden md:block">Showing {BLOG_POSTS_DATA.length} posts</div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS_DATA.map((post) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col h-full rounded-[2rem] border bg-card transition-all hover:shadow-[0_24px_64px_-16px_rgba(139,92,246,0.15)] hover:border-primary/40 hover:-translate-y-1"
              >
                <div className="aspect-[16/9] w-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden rounded-t-[2rem] border-b relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent group-hover:opacity-50 transition-opacity" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-30 z-10">{post.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-primary lowercase first-letter:uppercase">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {post.date}</span>
                  </div>
                  <h2 className="mb-4 text-2xl font-black leading-tight tracking-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mb-8 flex-1 text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center text-sm font-bold text-primary">
                    Read Article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
