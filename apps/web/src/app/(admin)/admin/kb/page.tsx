"use client"

import { KbSearchView } from "@/components/kb/search-view"

export default function AdminKnowledgebaseSearchPage() {
  return (
    <KbSearchView
      heading="Knowledgebase"
      subheading="Search your tenant knowledgebase with fast full-text lookup."
      settingsPath="/admin/kb/settings"
      documentPathPrefix="/admin/kb/documents"
    />
  )
}
