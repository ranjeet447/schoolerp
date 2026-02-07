"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Container } from './layout-foundation';
import { Menu, X, Landmark } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cn } from '../lib/utils';

const NAV_LINKS = [
  { label: 'Features', href: '/features' },
  { label: 'Use Cases', href: '/use-cases' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Integrations', href: '/integrations' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Security', href: '/security' },
];

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled 
          ? "bg-background/70 backdrop-blur-xl border-b border-primary/10 py-3 shadow-md" 
          : "bg-transparent py-6"
      )}
    >
      <Container className="flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-primary/40">
            <Landmark className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">
            School<span className="text-primary not-italic">ERP</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              className="px-4 py-2 text-sm font-bold text-muted-foreground transition-all duration-300 hover:text-primary hover:bg-primary/5 rounded-full relative group"
            >
              {link.label}
              <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-primary scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
          <div className="ml-4 pl-4 border-l border-primary/10">
            <Button size="sm" className="rounded-full font-black uppercase tracking-wider" onClick={() => window.location.href = '/book-demo'}>
              Book Demo
            </Button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="rounded-full p-2 lg:hidden bg-primary/10 text-primary transition-colors hover:bg-primary/20" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile Menu */}
      <motion.div 
        initial={false}
        animate={mobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="overflow-hidden lg:hidden bg-background/95 backdrop-blur-2xl border-b border-primary/10"
      >
        <div className="flex flex-col gap-2 p-6">
          {NAV_LINKS.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              className="px-4 py-3 text-lg font-bold text-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button size="lg" className="w-full mt-4 rounded-xl font-black uppercase tracking-widest" onClick={() => window.location.href = '/book-demo'}>
            Book Demo
          </Button>
        </div>
      </motion.div>
    </nav>
  );
};
