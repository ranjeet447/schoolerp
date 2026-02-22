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
  const featuredPost = BLOG_POSTS_DATA[0];
  const otherPosts = BLOG_POSTS_DATA.slice(1);

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Hero Section */}
      <div className="relative pt-40 pb-24 overflow-hidden border-b border-border/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none translate-x-1/2 translate-y-1/2" />
        
        <Container className="relative z-10">
          <Breadcrumbs items={[{ label: 'Blog' }]} />
          
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary mb-8 shadow-sm">
              <Sparkles className="h-4 w-4" /> Insight & Strategy
            </div>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-[0.9] mb-8 bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              Guides for Modern <br className="hidden md:block" /> Indian Schools
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium mx-auto max-w-2xl leading-relaxed">
              Actionable advice on fee collections, parent communication, and operational excellence.
            </p>
          </div>
        </Container>
      </div>

      {/* Featured Section */}
      <Section className="bg-background py-20">
        <Container>
          <Link href={`/blog/${featuredPost.slug}`} className="group relative block rounded-[3rem] overflow-hidden border border-border/50 bg-card/50 shadow-2xl transition-all hover:border-primary/30 hover:shadow-primary/5">
            <div className="grid lg:grid-cols-2 gap-0 overflow-hidden">
               <div className="relative aspect-[4/3] lg:aspect-auto min-h-[400px] bg-muted overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-indigo-500/30 opacity-40 group-hover:opacity-60 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/40 font-black text-4xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                        {featuredPost.category[0]}
                     </div>
                  </div>
                  <div className="absolute top-8 left-8">
                     <span className="px-4 py-1.5 rounded-full bg-primary text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                        Featured Article
                     </span>
                  </div>
               </div>
               <div className="p-12 lg:p-16 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-8">
                    <span className="text-primary">{featuredPost.category}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{featuredPost.date}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                  <h2 className="text-4xl lg:text-5xl font-black leading-[0.95] tracking-tight mb-8 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-lg lg:text-xl text-muted-foreground font-medium leading-relaxed mb-12">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest group-hover:gap-4 transition-all">
                    Continue Reading <ArrowRight className="h-4 w-4" />
                  </div>
               </div>
            </div>
          </Link>
        </Container>
      </Section>

      {/* Filter & Grid Section */}
      <Section className="bg-muted/30 py-24 border-y border-border/50">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {['All', 'Finance', 'Academics', 'Admissions', 'Operations', 'Communication'].map((cat) => (
                <button 
                  key={cat} 
                  className={`text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-2xl transition-all border shrink-0 ${
                    cat === 'All' 
                      ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 -translate-y-1' 
                      : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
              {BLOG_POSTS_DATA.length} Curated Guides
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map((post) => (
              <Link 
                key={post.slug} 
                href={`/blog/${post.slug}`}
                className="group flex flex-col h-full rounded-[2.5rem] border border-border/50 bg-card transition-all hover:shadow-2xl hover:border-primary/40 hover:-translate-y-2 overflow-hidden"
              >
                <div className="aspect-[16/10] w-full bg-muted flex items-center justify-center text-muted-foreground overflow-hidden relative border-b border-border/50">
                   <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent group-hover:opacity-50 transition-opacity" />
                   <div className="text-2xl font-black opacity-30 uppercase tracking-widest">{post.category}</div>
                </div>
                <div className="flex flex-1 flex-col p-10">
                  <div className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="text-primary truncate">{post.category}</span>
                    <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                    <span className="shrink-0">{post.date}</span>
                  </div>
                  <h3 className="mb-6 text-2xl font-black leading-none tracking-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="mb-10 flex-1 text-sm text-muted-foreground font-medium leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/70 group-hover:text-primary transition-colors">
                       Read Guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground/50">
                      {post.readTime}
                    </div>
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
