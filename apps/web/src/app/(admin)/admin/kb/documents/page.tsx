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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "@schoolerp/ui"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface KBDocument {
  id: string
  title: string
  category?: string
  tags: string[]
  visibility: "internal" | "parents" | "students"
  status: "draft" | "published" | "archived"
  content_text: string
  updated_at: string
}

const EMPTY_FORM = {
  title: "",
  category: "",
  tags: "",
  visibility: "internal",
  status: "draft",
  content_text: "",
}

export default function KBDocumentsPage() {
  const [docs, setDocs] = useState<KBDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<KBDocument | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const publishedCount = useMemo(() => docs.filter((d) => d.status === "published").length, [docs])

  const fetchDocs = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const res = await apiClient("/admin/kb/documents?limit=200")
      if (!res.ok) throw new Error((await res.text()) || "Failed to load KB documents")
      setDocs((await res.json()) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load KB documents")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  const resetForm = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const openCreate = () => {
    resetForm()
    setOpen(true)
  }

  const openEdit = (doc: KBDocument) => {
    setEditing(doc)
    setForm({
      title: doc.title,
      category: doc.category || "",
      tags: (doc.tags || []).join(", "),
      visibility: doc.visibility,
      status: doc.status,
      content_text: doc.content_text,
    })
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const payload = {
        title: form.title,
        category: form.category,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        visibility: form.visibility,
        status: form.status,
        content_text: form.content_text,
      }

      const url = editing ? `/admin/kb/documents/${editing.id}` : "/admin/kb/documents"
      const method = editing ? "PATCH" : "POST"

      const res = await apiClient(url, {
        method,
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to save document")

      setOpen(false)
      resetForm()
      await fetchDocs(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save document")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this knowledgebase document?")) return
    try {
      const res = await apiClient(`/admin/kb/documents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.text()) || "Failed to delete")
      await fetchDocs(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document")
    }
  }

  const togglePublish = async (doc: KBDocument) => {
    try {
      const targetStatus = doc.status === "published" ? "archived" : "published"
      const res = await apiClient(`/admin/kb/documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: targetStatus }),
      })
      if (!res.ok) throw new Error((await res.text()) || "Failed to update status")
      await fetchDocs(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Knowledgebase Documents</h1>
          <p className="text-muted-foreground">Create, edit, publish, and archive tenant-scoped knowledgebase documents.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchDocs(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Document
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-none shadow-sm bg-destructive/10">
          <CardContent className="pt-6 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-foreground">{docs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-foreground">{publishedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Draft / Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-foreground">{docs.length - publishedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-muted-foreground font-bold">Title</TableHead>
                <TableHead className="text-muted-foreground font-bold">Status</TableHead>
                <TableHead className="text-muted-foreground font-bold">Visibility</TableHead>
                <TableHead className="text-muted-foreground font-bold">Updated</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No KB documents yet. Create your first document to enable search.
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-foreground">{doc.title}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-1">{doc.category || "Uncategorized"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.status === "published" ? "default" : "secondary"} className={doc.status === "published" ? "bg-emerald-600 dark:bg-emerald-600/80 hover:bg-emerald-600" : ""}>{doc.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.visibility}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">{new Date(doc.updated_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => togglePublish(doc)}>
                        {doc.status === "published" ? "Archive" : "Publish"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(doc)} className="text-primary hover:text-primary hover:bg-primary/10">Edit</Button>
                      <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:bg-muted/50">
                        <Link href={`/admin/kb/documents/${doc.id}`}>Open</Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => remove(doc.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit KB Document" : "Create KB Document"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={form.visibility} onValueChange={(value) => setForm((p) => ({ ...p, visibility: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">internal</SelectItem>
                    <SelectItem value="parents">parents</SelectItem>
                    <SelectItem value="students">students</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(value) => setForm((p) => ({ ...p, status: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="published">published</SelectItem>
                    <SelectItem value="archived">archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                className="min-h-[260px]"
                value={form.content_text}
                onChange={(e) => setForm((p) => ({ ...p, content_text: e.target.value }))}
                placeholder="Paste knowledgebase content here..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
