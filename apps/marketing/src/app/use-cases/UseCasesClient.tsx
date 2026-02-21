"use client";

import React, { useState, useMemo } from "react";
import { USE_CASES_DATA, UseCaseGrid, Container, Section, UseCaseRole, UseCaseDetail } from "@schoolerp/ui";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const ROLES: { value: UseCaseRole | 'all'; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admins' },
  { value: 'principal', label: 'Principals' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'parent', label: 'Parents' }
];

export function UseCasesClient() {
  const [activeRole, setActiveRole] = useState<UseCaseRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = USE_CASES_DATA;
    if (activeRole !== 'all') {
      result = result.filter(uc => uc.targetRole === activeRole);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(uc => 
        uc.title.toLowerCase().includes(q) || 
        uc.shortDescription.toLowerCase().includes(q)
      );
    }
    return result.map(uc => ({
      slug: uc.slug,
      title: uc.title,
      description: uc.shortDescription,
      icon: uc.icon,
      stats: uc.stats,
      category: uc.targetRole.charAt(0).toUpperCase() + uc.targetRole.slice(1)
    }));
  }, [activeRole, searchQuery]);

  return (
    <div className="bg-background">
      <Section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
        
        <Container className="relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-8 backdrop-blur-xl">
              Workflow Solutions
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-8">
              Engineered for Every <br />
              <span className="text-primary italic">School Stakeholder</span>.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto mb-12">
              See how SchoolERP solves specific pain points for Principals, Admission teams, and Teachers.
            </p>
            
            <div className="relative max-w-lg mx-auto mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search use cases (e.g. fees, attendance)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-full border border-border/60 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  onClick={() => setActiveRole(role.value)}
                  className={`px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    activeRole === role.value 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </motion.div>
        </Container>
      </Section>

      <UseCaseGrid cases={filtered} />
    </div>
  );
}
