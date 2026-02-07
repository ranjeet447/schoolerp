import React from "react";
import { Metadata } from "next";
import { BookDemoClient } from "./BookDemoClient";

export const metadata: Metadata = {
  robots: "index, follow",
};

export default function BookDemoPage() {
  return (
    <main>
      <BookDemoClient />
    </main>
  );
}
