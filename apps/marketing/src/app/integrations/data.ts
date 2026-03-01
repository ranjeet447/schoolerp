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
  { name: 'Tally Prime (CSV Export)', category: 'Accounting', description: 'CSV export-ready ledger mapping for Indian accounting workflows (XML import roadmap depends on deployment setup).', status: 'beta', slug: 'tally' },
  { name: 'Google Workspace for Education', category: 'Live Classes', description: 'OAuth-based live class scheduling with Calendar + Google Meet links (tenant setup required).', status: 'beta', slug: 'google-workspace' },
  { name: 'Microsoft 365 Education', category: 'Live Classes', description: 'OAuth-based live class scheduling with Microsoft Graph Calendar + Teams meeting links.', status: 'beta', slug: 'teams-meet' },
  { name: 'Biometric/RFID', category: 'Hardware', description: 'Automated staff and student attendance.', status: 'planned', slug: 'biometric-rfid' },
  { name: 'Online Tests', category: 'Assessment', description: 'Objective auto-evaluation (MCQ) + assisted evaluation for subjective answers (teacher final).', status: 'planned', slug: 'online-tests' },
  { name: 'Alumni Module', category: 'Community', description: 'Directory, events, and donation drives.', status: 'planned', slug: 'alumni-module' },
  { name: 'MapmyIndia', category: 'Transport', description: 'Indian mapping services for transport tracking.', status: 'planned', slug: 'mapmyindia' },
];
