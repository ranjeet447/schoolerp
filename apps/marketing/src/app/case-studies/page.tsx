import Link from 'next/link';
import { CASE_STUDIES_DATA } from '@schoolerp/ui';
import { ArrowRight, BarChart, Building2, ShieldCheck, GraduationCap, MapPin } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  Finance: BarChart,
  Safety: ShieldCheck,
  Academics: GraduationCap,
  Governance: Building2,
};

export const metadata = {
  title: 'School Success Stories | Case Studies',
  description: 'See how schools across India are transforming their operations, improving safety, and boosting collections with our ERP.',
};

export default function CaseStudiesPage() {
  return (
    <div className="bg-white min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-slate-900 overflow-hidden text-white">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            Real Impact at <span className="text-blue-400">Real Schools</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            From rural trusts to elite international academies, discover how our platform solves the most complex educational challenges.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
            <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-full border border-slate-700">
              ₹25Cr+ Managed Annually
            </div>
            <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-full border border-slate-700">
              14+ Deep Success Stories
            </div>
            <div className="px-4 py-2 bg-slate-800/50 backdrop-blur rounded-full border border-slate-700">
              99.9% Client Retention
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CASE_STUDIES_DATA.map((study) => {
            const Icon = CATEGORY_ICONS[study.category] || Building2;
            
            return (
              <Link 
                key={study.id} 
                href={`/case-studies/${study.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                {/* Industry/Category Badge */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                   <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 bg-white ring-1 ring-slate-900/10 rounded-full text-xs font-semibold text-slate-900 shadow-sm">
                    <Icon className="w-3.5 h-3.5 text-blue-600" />
                    {study.category}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent group-hover:opacity-0 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 text-white z-10 transition-transform duration-300 group-hover:translate-x-2 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {study.location}
                    </div>
                    <div className="text-sm font-bold truncate max-w-[250px]">
                      {study.schoolName}
                    </div>
                  </div>
                  {/* Mock Image Placeholder with subtle pattern */}
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-slate-700 opacity-50" />
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow text-left">
                  <div className="mb-3 text-blue-600 font-bold text-lg leading-tight group-hover:text-blue-700">
                    {study.title}
                  </div>
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3">
                    {study.shortDescription}
                  </p>
                  
                  {/* Metrics */}
                  <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Key Result</div>
                      <div className="text-sm font-extrabold text-emerald-600">{study.impactMetric}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Type</div>
                      <div className="text-sm font-extrabold text-slate-900">{study.schoolType}</div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                    Read Success Story
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust Quote */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-6 text-slate-900">Want to be our next success story?</h2>
            <p className="text-slate-600 mb-8">
                Join 500+ forward-thinking educational institutions that are modernizing their administrative and academic operations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/contact" 
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Schedule Demo
              </Link>
              <Link 
                href="/pricing" 
                className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
