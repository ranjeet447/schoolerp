import React from 'react';
import { Container, Section } from './layout-foundation';
import { Check } from 'lucide-react';

interface FeatureModuleProps {
  title: string;
  description: string;
  benefits: string[];
  imageSide?: 'left' | 'right';
  badge: string;
}

export const FeatureDeepDive = ({ 
  title, 
  description, 
  benefits, 
  imageSide = 'right',
  badge
}: FeatureModuleProps) => {
  return (
    <Section spacing="default" className="overflow-hidden">
      <Container>
        <div className={`flex flex-col gap-12 lg:items-center ${imageSide === 'left' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium text-primary">
              {badge}
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {description}
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background to-muted">
                <span className="text-sm font-medium text-muted-foreground">UI Mockup: {title}</span>
              </div>
              {/* Decorative elements representing UI */}
              <div className="absolute top-4 left-4 right-4 h-full space-y-3 rounded-t-xl border bg-background p-4 shadow-sm opacity-90">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="h-2 w-24 rounded bg-muted" />
                  <div className="h-2 w-8 rounded bg-muted" />
                </div>
                <div className="space-y-2">
                   <div className="h-2 w-full rounded bg-primary/5" />
                   <div className="h-2 w-3/4 rounded bg-primary/5" />
                   <div className="h-2 w-1/2 rounded bg-primary/5" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </Section>
  );
};
