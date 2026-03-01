import React from "react";
import { Metadata } from "next";
import { BookDemoClient } from "./BookDemoClient";

export const metadata: Metadata = {
  title: "Book School ERP Demo | Fee Collection, Parent App, Attendance, Exams",
  description:
    "Book a SchoolERP demo to see online fee collection, parent app communication, attendance management, and exam/report card workflows in one platform.",
  keywords: [
    "book school erp demo",
    "school erp demo for schools",
    "fee collection software demo",
    "parent app for schools demo",
  ],
  alternates: {
    canonical: "/book-demo",
  },
  robots: "index, follow",
};

export default function BookDemoPage() {
  return (
    <main>
      <BookDemoClient />
    </main>
  );
}
