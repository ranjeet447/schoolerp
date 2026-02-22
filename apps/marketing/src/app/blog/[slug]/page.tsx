import React from 'react';
import { Container, Section, FinalCTA, BlogPostingSchema, FAQSchema, BLOG_POSTS_DATA, Breadcrumbs, Button } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Calendar, User, ChevronRight, Sparkles, Clock, Share2, Bookmark, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS_DATA.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS_DATA.find(p => p.slug === slug);
  
  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: `${post.title} | School Management Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://schoolerp.com/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      url: `https://schoolerp.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS_DATA.find(p => p.slug === slug);

  if (!post) notFound();

  const breadcrumbItems = [
    { label: 'Blog', href: '/blog' },
    { label: post.title }
  ];

  // Pick related posts by category
  const related = BLOG_POSTS_DATA.filter(p => p.category === post.category && p.slug !== slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-background relative selection:bg-primary/20">
       {/* Reading Progress Bar */}
       <div className="fixed top-[64px] left-0 w-full h-1 z-50 bg-primary/10">
         <div className="h-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)] w-0 transition-all duration-300" id="reading-progress" />
       </div>

       <BlogPostingSchema 
          title={post.title} 
          description={post.excerpt} 
          datePublished={new Date(post.date).toISOString()} 
          authorName={post.author}
          imageUrl="https://schoolerp.com/og-hero.png"
       />

       {/* Hero Section */}
       <div className="relative pt-32 pb-20 overflow-hidden border-b border-border/50">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <Container size="small" className="relative z-10">
            <Breadcrumbs items={breadcrumbItems} />

            <div className="mt-12 flex flex-col items-center text-center">
               <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-primary mb-8 shadow-sm">
                 <Sparkles className="h-4 w-4" /> {post.category}
               </div>
               
               <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[0.95] mb-8 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text">
                 {post.title}
               </h1>
               
               <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed mb-12 italic">
                 "{post.excerpt}"
               </p>

               <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/10">
                      <User className="h-5 w-5" />
                    </div>
                    <span>{post.author}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-border md:block hidden" />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{post.date}</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-border md:block hidden" />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{post.readTime}</span>
                  </div>
               </div>
            </div>
          </Container>
       </div>

       <Section className="bg-background py-20 relative">
          <Container className="lg:grid lg:grid-cols-12 gap-16 relative">
            
            {/* Left Sidebar - Desktop */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32 space-y-12">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Quick Actions</h4>
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" size="sm" className="justify-start gap-3 rounded-xl border-border/50 hover:border-primary/50 group h-11">
                      <Share2 className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span>Share Post</span>
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start gap-3 rounded-xl border-border/50 hover:border-primary/50 group h-11">
                      <Bookmark className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span>Bookmark</span>
                    </Button>
                  </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Table of Contents</h4>
                   <nav className="space-y-4 text-sm font-bold text-muted-foreground">
                      <a href="#intro" className="block hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary pl-4">Introduction</a>
                      <a href="#main" className="block hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary pl-4">Key Strategies</a>
                      <a href="#conclusion" className="block hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary pl-4">Final Verdict</a>
                   </nav>
                </div>

                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10">
                   <h5 className="font-black text-foreground mb-2">Build your school's future.</h5>
                   <p className="text-xs text-muted-foreground mb-6 leading-relaxed">Join 1,200+ Indian schools managing better with SchoolERP.</p>
                   <Button size="sm" className="w-full rounded-xl">Book a Demo</Button>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <div className="lg:col-span-6">
              <article className="prose prose-slate dark:prose-invert lg:prose-xl mx-auto 
                prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:border prose-img:border-border/50
                prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                prose-strong:text-foreground prose-strong:font-black
                marker:text-primary">
                
                <div id="intro" className="mb-12 scroll-mt-32">
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                </div>
                
                <div className="mt-16 pt-16 border-t border-border/50 flex flex-wrap gap-3">
                  {post.tags.map(tag => (
                    <span key={tag} className="px-4 py-1.5 rounded-full bg-muted text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border/50 hover:border-primary/30 transition-colors cursor-default">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>

              {/* Author Card */}
              <div className="mt-20 p-10 rounded-[3rem] bg-card border border-border/50 shadow-sm flex flex-col items-center text-center md:flex-row md:text-left md:items-start gap-8">
                 <div className="h-24 w-24 shrink-0 rounded-3xl bg-gradient-to-br from-primary/20 to-indigo-500/20 flex items-center justify-center text-primary border border-primary/10">
                    <User className="h-10 w-10" />
                 </div>
                 <div>
                    <h4 className="text-2xl font-black mb-2">{post.author}</h4>
                    <p className="text-muted-foreground font-medium leading-relaxed mb-6">
                      Ranjeet is the lead architect at SchoolERP with over 10 years of experience in school administration technology. He writes regularly about school automation and operational excellence.
                    </p>
                    <div className="flex gap-4">
                      <Button variant="outline" size="sm" className="rounded-xl h-10 px-5">Follow</Button>
                      <Button variant="ghost" size="sm" className="rounded-xl h-10 px-5">View Profile</Button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Sidebar - Desktop */}
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-32 space-y-12">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Trending in {post.category}</h4>
                  <div className="space-y-6">
                    {related.map(rPost => (
                      <Link key={rPost.slug} href={`/blog/${rPost.slug}`} className="group block">
                        <h5 className="font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-2">{rPost.title}</h5>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Clock className="h-3 w-3" /> {rPost.readTime}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

          </Container>
       </Section>

       {/* Related Section */}
       <Section className="bg-muted/30 py-32 border-t border-border/50">
          <Container>
             <div className="mb-16 flex items-end justify-between">
               <div>
                  <h2 className="text-4xl font-black tracking-tight mb-4 leading-none">More from our Blog</h2>
                  <p className="text-muted-foreground font-medium text-lg">Continue your journey with more insights.</p>
               </div>
               <Link href="/blog">
                 <Button variant="outline" className="rounded-2xl h-12 px-8 border-border/50 group">
                    Explore All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                 </Button>
               </Link>
             </div>

             <div className="grid gap-8 md:grid-cols-3">
                {related.map((relPost) => (
                  <Link 
                    key={relPost.slug} 
                    href={`/blog/${relPost.slug}`} 
                    className="group bg-card rounded-[2.5rem] p-8 border border-border/50 shadow-sm hover:shadow-2xl hover:border-primary/40 transition-all hover:-translate-y-2 flex flex-col"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 block">{relPost.category}</span>
                    <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors mb-6 flex-1">
                      {relPost.title}
                    </h3>
                    <div className="mt-8 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground group-hover:text-foreground">
                        <Clock className="h-3.5 w-3.5" /> {relPost.readTime}
                      </div>
                      <div className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                ))}
             </div>
          </Container>
       </Section>

       <FinalCTA />
       
       <Script id="reading-progress-script" strategy="afterInteractive">
         {\`
           window.addEventListener('scroll', () => {
             const progress = document.getElementById('reading-progress');
             if (progress) {
               const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
               const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
               const scrolled = (winScroll / height) * 100;
               progress.style.width = scrolled + "%";
             }
           });
         \`}
       </Script>
    </main>
  );
}
