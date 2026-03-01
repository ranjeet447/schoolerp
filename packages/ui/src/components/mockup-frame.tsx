'use client';

import React from 'react';
import { BrowserFrame, MobileFrame } from './browser-frame';

type MockupFrameProps = {
  src: string;
  alt: string;
  className?: string;
  device?: 'desktop' | 'mobile';
};

export function MockupFrame({ src, alt, className, device = 'desktop' }: MockupFrameProps) {
  if (device === 'mobile') {
    return <MobileFrame src={src} alt={alt} className={className} />;
  }
  return <BrowserFrame src={src} alt={alt} className={className} />;
}

