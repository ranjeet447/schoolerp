import { headers } from 'next/headers';

export async function getTenantId(): Promise<string> {
  const headerList = await headers();
  const rawHost = (headerList.get('x-forwarded-host') || headerList.get('host') || '').trim().toLowerCase();
  let host = rawHost;
  if (host.includes(',')) {
    host = host.split(',')[0]?.trim() || '';
  }
  if (host.startsWith('https://')) host = host.slice(8);
  if (host.startsWith('http://')) host = host.slice(7);
  if (host.includes('/')) host = host.split('/')[0] || host;
  if (host.includes(':')) host = host.split(':')[0] || host;
  host = host.replace(/\.$/, '');

  // Send the normalized host as tenant identifier.
  // API resolves it as:
  // - UUID
  // - subdomain
  // - full custom domain
  if (host && host !== 'localhost' && host !== 'www') {
    return host;
  }

  // Fallback for direct IP or non-subdomain access in development
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'demo';
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
