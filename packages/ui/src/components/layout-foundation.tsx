import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'small' | 'large';
  children: React.ReactNode;
  className?: string;
}

export const Container = ({ 
  children, 
  className, 
  size = 'default',
  ...props 
}: ContainerProps) => {
  return (
    <div 
      className={cn(
        "mx-auto px-6",
        size === 'default' && "max-w-7xl",
        size === 'small' && "max-w-4xl",
        size === 'large' && "max-w-[1440px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: 'default' | 'large' | 'none';
  children: React.ReactNode;
  className?: string;
}

export const Section = ({ 
  children, 
  className, 
  spacing = 'default',
  ...props 
}: SectionProps) => {
  return (
    <section 
      className={cn(
        spacing === 'default' && "py-16 sm:py-24", // Reduced from 24/32
        spacing === 'large' && "py-20 sm:py-32",   // Reduced from 32/48
        spacing === 'none' && "py-0",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
};

