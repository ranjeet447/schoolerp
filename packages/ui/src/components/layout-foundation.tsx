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
        "mx-auto px-6 md:px-12",
        size === 'default' && "max-w-7xl",
        size === 'small' && "max-w-4xl",
        size === 'large' && "max-w-[1600px]",
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
        "relative",
        spacing === 'default' && "py-16 md:py-24",
        spacing === 'large' && "py-24 md:py-32",
        spacing === 'none' && "py-0",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
};

