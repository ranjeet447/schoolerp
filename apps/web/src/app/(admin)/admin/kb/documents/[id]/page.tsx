"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@schoolerp/ui"
import { Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface DocumentPayload {
  document: {
    id: string
    title: string
    category?: string
    tags: string[]
    visibility: string
    status: string
    content_text: string
    updated_at: string
  }
  chunks: Array<{
    id: string
    chunk_index: number
    content: string
  }>
}

export default function KBDocumentViewPage() {
  const params = useParams<{ id: string }>()
  const [data, setData] = useState<DocumentPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await apiClient(`/admin/kb/documents/${params.id}`)
        if (!res.ok) throw new Error((await res.text()) || "Failed to load document")
        setData(await res.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document")
      } finally {
        setLoading(false)
      }
    }
    if (params.id) run()
  }, [params.id])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error || "Document not found"}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/kb/documents">Back to documents</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{data.document.title}</h1>
          <div className="flex gap-2 items-center flex-wrap">
            {data.document.category && <Badge variant="outline">{data.document.category}</Badge>}
            <Badge variant="secondary">{data.document.status}</Badge>
            <Badge variant="outline">{data.document.visibility}</Badge>
            {(data.document.tags || []).map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/kb/documents">Back</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/kb/documents">Manage Documents</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Content</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-6">{data.document.content_text}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Chunks ({data.chunks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.chunks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No chunks generated for this document.</p>
          ) : (
            data.chunks.map((chunk) => (
              <div key={chunk.id} className="border rounded-md p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Chunk #{chunk.chunk_index}</p>
                <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
