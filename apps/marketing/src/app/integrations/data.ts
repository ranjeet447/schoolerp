export type IntegrationStatus = 'active' | 'beta' | 'planned';

export type IntegrationItem = {
  name: string;
  category: string;
  description: string;
  status: IntegrationStatus;
  slug: string;
  docs?: string;
};

export const INTEGRATIONS: IntegrationItem[] = [
  { name: 'Razorpay', category: 'Payments', description: 'Collect online fees with automatic receipt triggers.', status: 'active', slug: 'razorpay', docs: 'https://razorpay.com/docs' },
  { name: 'WhatsApp Business', category: 'Messaging', description: 'Absence and fee alerts delivered to parents in WhatsApp.', status: 'beta', slug: 'whatsapp' },
  { name: 'Traccar GPS', category: 'Transport', description: 'Real-time school bus tracking integration.', status: 'beta', slug: 'traccar' },
  { name: 'Tally Prime', category: 'Accounting', description: 'Export-ready ledger mapping for Indian accounting.', status: 'planned', slug: 'tally' },
  { name: 'Google Workspace', category: 'Identity', description: 'SSO and calendar sync for staff.', status: 'planned', slug: 'google-workspace' },
  { name: 'Microsoft Teams/Meet', category: 'Communication', description: 'Link classes and PTMs directly to meeting links.', status: 'planned', slug: 'teams-meet' },
];
