"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_NAME = "SchoolERP";

const EXACT_TITLES: Record<string, string> = {
  "/": APP_NAME,
  "/auth/login": `Login | ${APP_NAME}`,
  "/auth/forget-password": `Forgot Password | ${APP_NAME}`,
  "/auth/reset-password": `Reset Password | ${APP_NAME}`,
  "/auth/legal-accept": `Legal Acceptance | ${APP_NAME}`,
};

const SEGMENT_LABELS: Record<string, string> = {
  kb: "KB",
  hrms: "HRMS",
  api: "API",
  mfa: "MFA",
  rbac: "RBAC",
  otp: "OTP",
  id: "ID",
  ids: "IDs",
  "id-cards": "ID Cards",
  "internal-users": "Internal Users",
  "signup-requests": "Signup Requests",
  "audit-logs": "Audit Logs",
  "security-events": "Security Events",
  "password-policy": "Password Policy",
  "custom-fields": "Custom Fields",
  "bulk-import": "Bulk Import",
  "school-profile": "School Profile",
  "staff-attendance": "Staff Attendance",
  "class-teachers": "Class Teachers",
  "question-bank": "Question Bank",
  "lesson-review": "Lesson Review",
  "syllabus-lag": "Syllabus Lag",
  "learning-resources": "Learning Resources",
  "digital-assets": "Digital Assets",
  "gate-passes": "Gate Passes",
  "book-demo": "Book Demo",
  "use-cases": "Use Cases",
  finance: "Fee Collection & Accounting",
  fees: "Fees & Dues",
  communication: "Parent Communication",
  notices: "Parent Communication",
  exams: "Exams & Report Cards",
  sis: "Student Profile",
};

function isLikelyId(segment: string): boolean {
  if (/^\d+$/.test(segment)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(segment)) return true;
  return segment.length >= 10 && /\d/.test(segment) && /^[a-z0-9_-]+$/i.test(segment);
}

function titleCaseWord(word: string): string {
  const lower = word.toLowerCase();
  if (SEGMENT_LABELS[lower]) return SEGMENT_LABELS[lower];
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatSegment(segment: string): string {
  const lower = segment.toLowerCase();
  if (SEGMENT_LABELS[lower]) return SEGMENT_LABELS[lower];

  return lower
    .split(/[-_]+/)
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

function buildTitle(pathname: string): string {
  if (EXACT_TITLES[pathname]) return EXACT_TITLES[pathname];

  const rawSegments = pathname.split("/").filter(Boolean);
  if (rawSegments.length === 0) return APP_NAME;

  const labels: string[] = [];

  for (let i = 0; i < rawSegments.length; i += 1) {
    const segment = rawSegments[i];
    if (isLikelyId(segment)) {
      if (i === rawSegments.length - 1) labels.push("Details");
      continue;
    }
    labels.push(formatSegment(segment));
  }

  if (labels.length === 0) return APP_NAME;

  if (labels.length >= 2 && labels[1] === "Dashboard") {
    const [role] = labels;
    return `${role} Dashboard | ${APP_NAME}`;
  }

  return `${labels.slice().reverse().join(" | ")} | ${APP_NAME}`;
}

export function RouteTitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = buildTitle(pathname || "/");
  }, [pathname]);

  return null;
}
