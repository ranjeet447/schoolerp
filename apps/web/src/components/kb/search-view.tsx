"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@schoolerp/ui"
import { Search, Info, Loader2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface SearchResult {
  document_id: string
  title: string
  category?: string
  tags: string[]
  visibility: string
  status: string
  chunk_id: string
  chunk_index: number
  snippet_html: string
  score: number
  updated_at: string
}

interface SearchResponse {
  answer_mode: string
  model_used: string
  confidence: number
  summary: string
  results: SearchResult[]
  meta: {
    used_trgm: boolean
    total: number
    latency_ms: number
  }
}

interface FacetsResponse {
  categories: string[]
  tags: string[]
}

interface SearchViewProps {
  heading: string
  subheading: string
  settingsPath?: string
  documentPathPrefix?: string
}

export function KbSearchView({ heading, subheading, settingsPath, documentPathPrefix }: SearchViewProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [visibility, setVisibility] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [topK, setTopK] = useState(10)

  const [facets, setFacets] = useState<FacetsResponse>({ categories: [], tags: [] })
  const [facetsLoading, setFacetsLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [error, setError] = useState("")

  const [summary, setSummary] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [meta, setMeta] = useState<SearchResponse["meta"] | null>(null)

  useEffect(() => {
    let active = true
    const fetchFacets = async () => {
      setFacetsLoading(true)
      setError("")
      try {
        const res = await apiClient("/kb/facets")
        if (!res.ok) {
          if (res.status === 403) {
            if (active) setAccessDenied(true)
            return
          }
          throw new Error((await res.text()) || "Failed to load knowledgebase filters")
        }
        const data = (await res.json()) as FacetsResponse
        if (!active) return
        setAccessDenied(false)
        setFacets({
          categories: data.categories || [],
          tags: data.tags || [],
        })
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : "Failed to load knowledgebase filters")
      } finally {
        if (active) setFacetsLoading(false)
      }
    }

    fetchFacets()
    return () => {
      active = false
    }
  }, [])

  const infoMeta = useMemo(() => {
    if (!meta) return ""
    return `${meta.total} result(s) · ${meta.latency_ms}ms · ${meta.used_trgm ? "FTS + trigram" : "FTS"}`
  }, [meta])

  const onSearch = async () => {
    setSearching(true)
    setError("")
    try {
      const res = await apiClient("/kb/search", {
        method: "POST",
        body: JSON.stringify({
          q: query,
          top_k: topK,
          filters: {
            category,
            tags: selectedTags,
            visibility,
            status: "published",
          },
        }),
      })
      if (!res.ok) {
        if (res.status === 403) {
          setAccessDenied(true)
          return
        }
        throw new Error((await res.text()) || "Search failed")
      }
      const data = (await res.json()) as SearchResponse
      setAccessDenied(false)
      setSummary(data.summary || "")
      setResults(data.results || [])
      setMeta(data.meta || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }

  const toggleTag = (tag: string, checked: boolean | "indeterminate") => {
    const isChecked = checked === true
    setSelectedTags((prev) => {
      if (isChecked) {
        if (prev.includes(tag)) return prev
        return [...prev, tag]
      }
      return prev.filter((t) => t !== tag)
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
      </div>

      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="pt-5 text-sm text-blue-800 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>Knowledgebase Search (AI assistant coming soon).</span>
        </CardContent>
      </Card>

      {accessDenied && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <p className="text-sm text-muted-foreground">Knowledgebase access is not enabled for your role in this tenant.</p>
            {settingsPath && (
              <Button asChild variant="outline" size="sm">
                <Link href={settingsPath}>Open KB Settings</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-none shadow-sm bg-destructive/10">
          <CardContent className="pt-6 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search your school knowledgebase"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch()
              }}
            />
            <Button onClick={onSearch} disabled={searching || !query.trim()} className="gap-2">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {facets.categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility || "__all__"} onValueChange={(v) => setVisibility(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All visibility</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Top K</Label>
              <Input
                type="number"
                min={1}
                max={25}
                value={topK}
                onChange={(e) => setTopK(Math.max(1, Math.min(25, Number(e.target.value) || 10)))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="max-h-28 overflow-y-auto border rounded-md p-2 space-y-1">
                {facetsLoading ? (
                  <p className="text-xs text-muted-foreground">Loading tags...</p>
                ) : facets.tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags available</p>
                ) : (
                  facets.tags.map((tag) => (
                    <label key={tag} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={selectedTags.includes(tag)} onCheckedChange={(v) => toggleTag(tag, v)} />
                      <span>{tag}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(summary || results.length > 0 || meta) && (
        <Card className="border-none shadow-sm overflow-hidden border-primary/20 bg-primary/5">
          <CardHeader className="border-b border-primary/10 bg-primary/10">
            <CardTitle className="text-base text-primary font-semibold">Summary from Knowledgebase (auto-extracted)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6">
            <p className="text-sm font-medium leading-relaxed">{summary || "Not found in KB"}</p>
            {infoMeta && <p className="text-xs text-muted-foreground mt-4 font-medium">{infoMeta}</p>}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {results.length === 0 && summary && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">Not found in your school knowledgebase.</CardContent>
          </Card>
        )}

        {results.map((result) => (
          <Card key={result.chunk_id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">{result.title}</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {result.category && <Badge variant="outline">{result.category}</Badge>}
                    <Badge variant="secondary">{result.visibility}</Badge>
                    <Badge variant="outline">{result.status}</Badge>
                    <Badge variant="outline">score {result.score.toFixed(2)}</Badge>
                    {result.tags?.map((tag) => (
                      <Badge key={`${result.chunk_id}-${tag}`} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </div>
                {documentPathPrefix ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`${documentPathPrefix}/${result.document_id}`}>Open</Link>
                  </Button>
                ) : null}
              </div>

              <div
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet_html) }}
              />
              <p className="text-xs text-muted-foreground">Citation: {result.title} · chunk #{result.chunk_index}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function sanitizeSnippet(rawHtml: string): string {
  const stripped = (rawHtml || "")
    .replace(/<(?!\/?mark\b)[^>]*>/gi, "")
    .replace(/<mark[^>]*>/gi, "<mark>")
    .replace(/<\/mark[^>]*>/gi, "</mark>")
  return stripped
}
