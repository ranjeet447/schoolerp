import React from "react";
import { Metadata } from "next";
import { FinalCTA } from "@schoolerp/ui";
import { ResourcesClient } from "./ResourcesClient";

export const metadata: Metadata = {
  title: "School Management Resources & Compliance Hub",
  description: "Download board-compliant checklists, policy templates, and growth guides specifically built for budget and private schools in India.",
  alternates: {
    canonical: "https://schoolerp.com/resources"
  }
};

export default function ResourcesPage() {
  return (
    <main>
      <ResourcesClient />
      <FinalCTA />
    </main>
  );
}
