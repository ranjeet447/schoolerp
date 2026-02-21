import React from 'react';
import { Container, Section, FinalCTA, BlogPostingSchema, FAQSchema, BLOG_POSTS_DATA, Breadcrumbs } from '@schoolerp/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, ChevronRight } from 'lucide-react';
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
  const related = BLOG_POSTS_DATA.filter(p => p.category === post.category && p.slug !== slug).slice(0, 2);

  return (
    <main className="pt-24 min-h-screen bg-background">
       <BlogPostingSchema 
          title={post.title} 
          description={post.excerpt} 
          datePublished={new Date(post.date).toISOString()} 
          authorName={post.author}
          imageUrl="https://schoolerp.com/og-hero.png"
       />

       <Section className="bg-muted/10 pb-16 pt-32 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
         <Container size="small" className="relative z-10">
            <Breadcrumbs items={breadcrumbItems} />

            <header className="mt-12 mb-16 text-center">
               <div className="mb-8 flex justify-center flex-wrap gap-4 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                 <span className="text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">{post.category}</span>
                 <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {post.date}</span>
                 <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author}</span>
               </div>
               <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl lg:text-7xl leading-[0.95] mb-8">{post.title}</h1>
               <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">{post.excerpt}</p>
            </header>

            <article className="prose prose-slate dark:prose-invert lg:prose-lg mx-auto prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-3xl prose-img:shadow-2xl">
               <div dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>

            {related.length > 0 && (
               <div className="mt-24 bg-muted/30 rounded-[3rem] p-10 lg:p-16 border border-border/50">
                 <h3 className="text-3xl font-black tracking-tight mb-10">Related Reading</h3>
                 <div className="grid sm:grid-cols-2 gap-8">
                   {related.map(relPost => (
                     <Link key={relPost.slug} href={`/blog/${relPost.slug}`} className="group block bg-card rounded-3xl p-8 border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all">
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block">{relPost.category}</span>
                       <h4 className="font-bold text-xl group-hover:text-primary transition-colors leading-tight mb-6">{relPost.title}</h4>
                       <div className="flex items-center text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                         Read article <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                       </div>
                     </Link>
                   ))}
                 </div>
               </div>
            )}
         </Container>
       </Section>
       <FinalCTA />
    </main>
  );
}
