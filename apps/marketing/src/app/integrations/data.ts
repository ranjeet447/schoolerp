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
  { name: 'Biometric/RFID', category: 'Hardware', description: 'Automated staff and student attendance.', status: 'planned', slug: 'biometric-rfid' },
  { name: 'Online Tests', category: 'Assessment', description: 'Objective auto-evaluation (MCQ) + assisted evaluation for subjective answers (teacher final).', status: 'planned', slug: 'online-tests' },
  { name: 'Alumni Module', category: 'Community', description: 'Directory, events, and donation drives.', status: 'planned', slug: 'alumni-module' },
  { name: 'MapmyIndia', category: 'Transport', description: 'Indian mapping services for transport tracking.', status: 'planned', slug: 'mapmyindia' },
];
