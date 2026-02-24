import { CASE_STUDIES_DATA } from '@schoolerp/ui';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Quote, MapPin, Building2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return CASE_STUDIES_DATA.map((study) => ({
    slug: study.slug,
  }));
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const study = CASE_STUDIES_DATA.find((s) => s.slug === slug);

  if (!study) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Header / Breadcrumb */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <Link href="/case-studies" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Case Studies
          </Link>
        </div>
      </div>

      <article className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
            
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  {study.category} Success Story
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                  {study.title}
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed font-medium">
                  {study.shortDescription}
                </p>
              </div>

              {/* Stats Bar (Mobile) */}
              <div className="lg:hidden grid grid-cols-3 gap-4 mb-10 pb-8 border-b border-slate-100">
                {study.stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stat.value}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Full Body HTML */}
              <div 
                className="prose prose-slate prose-lg max-w-none 
                prose-headings:text-slate-900 prose-headings:font-bold
                prose-p:text-slate-600 prose-p:leading-relaxed
                prose-strong:text-slate-900 prose-strong:font-bold
                prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-1"
                dangerouslySetInnerHTML={{ __html: study.body }}
              />

              {/* Testimonial Section */}
              <div className="mt-16 bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden text-white shadow-2xl">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Quote className="w-24 h-24 rotate-180" />
                 </div>
                 <div className="relative z-10">
                    <p className="text-2xl md:text-3xl font-medium leading-relaxed mb-8 italic">
                      \"{study.testimonial.quote}\"
                    </p>
                    <div className="flex items-center gap-4 pt-8 border-t border-white/10 text-left">
                       <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xl">
                        {study.testimonial.author[0]}
                       </div>
                       <div>
                          <div className="font-bold text-lg">{study.testimonial.author}</div>
                          <div className="text-blue-400 font-medium">{study.testimonial.role}, {study.schoolName}</div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Sidebar Meta */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-8">
                {/* Metrics Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Impact Metrics
                  </h3>
                  <div className="space-y-6 text-left">
                    {study.stats.map((stat, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-sm font-medium text-slate-500 mb-1">{stat.label}</span>
                        <span className="text-3xl font-extrabold text-slate-900">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Institution Details */}
                <div className="bg-slate-50 rounded-2xl p-8 text-left">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">About the Institution</h3>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                         <Building2 className="w-5 h-5 text-slate-400 mt-0.5" />
                         <div>
                            <div className="font-bold text-slate-900">{study.schoolName}</div>
                            <div className="text-sm text-slate-500">{study.schoolType} Institution</div>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                         <div>
                            <div className="text-sm text-slate-500">Location</div>
                            <div className="font-bold text-slate-900">{study.location}</div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Related Features */}
                <div className="text-left">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">Key Modules Used</h3>
                   <div className="flex flex-wrap gap-2">
                      {study.relatedFeatures.map((feat) => (
                        <span key={feat} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                          {feat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      ))}
                   </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </article>

      {/* Re-linking to more case studies */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Discover More Success Stories</h2>
            <div className="flex flex-wrap justify-center gap-4">
               {CASE_STUDIES_DATA.filter(s => s.id !== study.id).slice(0, 3).map(s => (
                  <Link key={s.id} href={`/case-studies/${s.slug}`} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">
                    {s.schoolName}
                  </Link>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
