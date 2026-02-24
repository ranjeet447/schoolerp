import React from 'react';
import { Metadata } from 'next';
import { 
  Container, 
  Section, 
  BrowserFrame, 
  MobileFrame, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  FinalCTA 
} from '@schoolerp/ui';

export const metadata: Metadata = {
  title: 'Product Gallery - School ERP Dashboards',
  description: 'Take a tour of the School ERP interface. Real screenshots of Admin, Teacher, and Parent dashboards.',
};

const SCREENSHOTS = {
  admin: [
    { title: 'Administrator Dashboard', src: '/product-screens/admin/admin-dashboard.png', description: 'Centralized control center for school management.' },
    { title: 'Student Management', src: '/product-screens/admin/admin-students.png', description: 'Full SIS with 360-degree student profiles.' },
    { title: 'Financial Analytics', src: '/product-screens/admin/admin-finance.png', description: 'Real-time revenue tracking and fee analytics.' },
  ],
  teacher: [
    { title: 'Teacher Dashboard', src: '/product-screens/teacher/teacher-dashboard.png', description: 'Simplified daily workflow for educators.' },
    { title: 'Attendance Marking', src: '/product-screens/teacher/teacher-attendance.png', description: '1-click attendance marking for classes.' },
    { title: 'Mobile View', src: '/product-screens/teacher/teacher-dashboard-mobile.png', description: 'Mobile-first design for on-the-go access.', isMobile: true },
  ],
  accountant: [
    { title: 'Finance Center', src: '/product-screens/accountant/accountant-dashboard.png', description: 'Comprehensive fee collection and ledger management.' },
    { title: 'Real-time Collections', src: '/product-screens/accountant/accountant-collections.png', description: 'Monitor daily cash, cheque, and UPI collections.' },
  ],
  parent: [
    { title: 'Parent Portal', src: '/product-screens/parent/parent-dashboard.png', description: 'Stay updated with your child\'s progress and notices.' },
    { title: 'Fee Payments', src: '/product-screens/parent/parent-fees.png', description: 'Secure online fee payments with instant receipts.' },
  ]
};

export default function ProductGalleryPage() {
  return (
    <main className="pt-24 min-h-screen bg-background">
      <Section spacing="large" className="bg-muted/30">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
            <h1 className="text-4xl md:text-7xl font-black tracking-tight">
              Interface <span className="text-primary italic">Preview</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              Explore the premium, intuitive interface used by thousands of schools across India. No dummy data, just real productivity.
            </p>
          </div>

          <Tabs defaultValue="admin" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="bg-background/50 backdrop-blur-md p-1 border rounded-full">
                <TabsTrigger value="admin" className="rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Admin</TabsTrigger>
                <TabsTrigger value="teacher" className="rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Teacher</TabsTrigger>
                <TabsTrigger value="accountant" className="rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Accountant</TabsTrigger>
                <TabsTrigger value="parent" className="rounded-full px-8 py-3 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Parent</TabsTrigger>
              </TabsList>
            </div>

            {Object.entries(SCREENSHOTS).map(([role, items]) => (
              <TabsContent key={role} value={role} className="space-y-24 focus-visible:outline-none">
                {items.map((item, idx) => (
                  <div key={idx} className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                    <div className={`lg:col-span-5 space-y-6 ${idx % 2 === 1 ? 'lg:order-2' : ''}`}>
                      <div className="h-1 dark:bg-primary/20 bg-primary/10 w-24 rounded-full" />
                      <h2 className="text-3xl font-black tracking-tight">{item.title}</h2>
                      <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                    <div className="lg:col-span-7 relative group">
                      <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item.isMobile ? (
                        <MobileFrame src={item.src} alt={item.title} className="relative z-10" />
                      ) : (
                        <BrowserFrame src={item.src} alt={item.title} className="relative z-10" />
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </Container>
      </Section>
      <FinalCTA />
    </main>
  );
}
