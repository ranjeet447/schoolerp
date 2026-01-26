"use client";

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconMapperProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number | string;
  color?: string;
}

export const IconMapper = ({ name, size = 24, color = "currentColor", ...props }: IconMapperProps) => {
  const IconComponent = (LucideIcons as any)[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    return <LucideIcons.HelpCircle size={size} color={color} {...props} />;
  }

  return <IconComponent size={size} color={color} {...props} />;
};
