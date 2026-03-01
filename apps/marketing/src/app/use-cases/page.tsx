import React from "react";
import { Metadata } from "next";
import { FinalCTA } from "@schoolerp/ui";
import { UseCasesClient } from "./UseCasesClient";

export const metadata: Metadata = {
  title: "School ERP Use Cases | Fees, Parent App, Attendance & Exams",
  description: "See school ERP use cases for fee collection teams, parent communication workflows, attendance management, and exam/report card operations.",
  keywords: [
    "school fee collection software",
    "parent communication app for schools",
    "school attendance management system",
    "exam management software for schools",
    "report card software for schools"
  ],
  alternates: {
    canonical: "https://schoolerp.com/use-cases",
  },
};

export default function UseCasesPage() {
  return (
    <main>
      <UseCasesClient />
      <FinalCTA />
    </main>
  );
}
