import React from "react";
import { Metadata } from "next";
import { FinalCTA } from "@schoolerp/ui";
import { UseCasesClient } from "./UseCasesClient";

export const metadata: Metadata = {
  title: "Use Cases - School ERP",
  description: "See how schools like yours are succeeding with our platform.",
};

export default function UseCasesPage() {
  return (
    <main>
      <UseCasesClient />
      <FinalCTA />
    </main>
  );
}
