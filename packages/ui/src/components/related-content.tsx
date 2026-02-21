import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface RelatedItem {
  type: 'Feature' | 'Use Case' | 'Resource' | 'Blog';
  title: string;
  href: string;
  description?: string;
}

export const RelatedContent = ({ items }: { items: RelatedItem[] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-20 pt-16 border-t border-border">
      <h3 className="text-2xl font-black tracking-tight mb-8">Related Content to Explore</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <Link key={index} href={item.href} className="group block bg-card/60 rounded-2xl p-6 border shadow-sm hover:shadow-md hover:border-primary/30 transition-all backdrop-blur-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 block">{item.type}</span>
            <h4 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">{item.title}</h4>
            {item.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            )}
            <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
              Read Further <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
