"use client";

import React from 'react';
import { 
  AttendanceGrid, 
  FeePlanBuilder, 
  NoticeCard, 
  StudentProfileCard, 
  ReportCardPreviewCard, 
  ReceiptCard,
  Container,
  Section
} from '@schoolerp/ui';

export default function MockupStagePage() {
  return (
    <main className="bg-slate-50 min-h-screen py-20 px-10">
      <div id="attendance-mockup" className="mb-20">
        <h2 className="text-2xl font-bold mb-6">Attendance Grid (Teacher UI)</h2>
        <div className="bg-white p-8 rounded-3xl shadow-xl border max-w-4xl">
          <AttendanceGrid 
            students={[
              { id: '1', name: 'Aryan Sharma', rollNumber: '101', status: 'present' },
              { id: '2', name: 'Priya Gupta', rollNumber: '102', status: 'absent', remarks: 'Medical leave' },
              { id: '3', name: 'Rohan Verma', rollNumber: '103', status: 'present' },
              { id: '4', name: 'Sanya Malhotra', rollNumber: '104', status: 'late' },
            ]}
            onStatusChange={() => {}}
            readOnly
          />
        </div>
      </div>

      <div id="fee-mockup" className="mb-20">
        <h2 className="text-2xl font-bold mb-6">Fee Plan Builder (Admin UI)</h2>
        <div className="bg-white p-8 rounded-3xl shadow-xl border max-w-2xl">
          <FeePlanBuilder onSave={() => {}} />
        </div>
      </div>

      <div id="notice-mockup" className="mb-20">
        <h2 className="text-2xl font-bold mb-6">Notice Card (Parent App)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <NoticeCard 
            id="1"
            title="Annual Sports Day 2024"
            content="Join us for our annual sports day celebration on Friday, Dec 15th. All students must wear their house uniforms."
            date="Dec 10, 2024"
            category="Event"
            isRead={false}
          />
          <NoticeCard 
            id="2"
            title="Quarterly Results Out"
            content="The results for the first quarter have been published. Please check the academics section."
            date="Dec 08, 2024"
            category="Academic"
            isRead={true}
          />
        </div>
      </div>

      <div id="student-mockup" className="mb-20">
        <h2 className="text-2xl font-bold mb-6">Student Profile & Report Card</h2>
        <div className="flex flex-wrap gap-8">
          <StudentProfileCard 
            student={{
              name: 'Aryan Sharma',
              grade: 'Grade 10-A',
              rollNumber: '101',
              status: 'Active',
              attendance: '98%',
              feeStatus: 'Paid'
            }}
          />
          <ReportCardPreviewCard 
             examName="Term 1 Final"
             results={[
               { name: "Mathematics", marks: 95, maxMarks: 100 },
               { name: "Science", marks: 92, maxMarks: 100 },
               { name: "English", marks: 88, maxMarks: 100 },
               { name: "History", marks: 90, maxMarks: 100 }
             ]}
          />
        </div>
      </div>

      <div id="receipt-mockup" className="mb-20">
        <h2 className="text-2xl font-bold mb-6">Fee Receipt (Finance)</h2>
        <div className="max-w-md">
           <ReceiptCard 
              receiptNo="REC-2024-001"
              studentName="Priya Gupta"
              date="Dec 12, 2024"
              amount={12500}
              paymentMethod="UPI"
              status="Success"
           />
        </div>
      </div>
    </main>
  );
}
