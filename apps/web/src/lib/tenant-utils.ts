import { headers } from 'next/headers';

export async function getTenantId(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get('host') || '';

  // Logic aligned with middleware.ts
  // Example: school1.schoolerp.com -> school1
  // Local: school1.localhost:3000 -> school1
  const parts = host.split('.');

  if (parts.length >= 2) {
    if (parts[0] !== 'www' && parts[0] !== 'localhost') {
      return parts[0];
    }
  }

  // Fallback for direct IP or non-subdomain access in development
  return 'demo';
}

export interface TenantConfig {
  name: string;
  white_label: boolean;
  board_type?: string;
  branding: {
    primary_color?: string;
    name_override?: string;
    logo_url?: string;
  };
}

export async function getTenantConfig(): Promise<TenantConfig | null> {
  const tenant = await getTenantId();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

  try {
    const res = await fetch(`${API_URL}/tenants/config`, {
      headers: {
        'X-Tenant-ID': tenant
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.config as TenantConfig;
  } catch (e) {
    console.error('Failed to fetch tenant config:', e);
    return null;
  }
}
