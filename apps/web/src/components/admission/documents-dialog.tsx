"use client"

import { useEffect, useState } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { FileText, Upload, Trash2, Loader2 } from "lucide-react"
import { AdmissionApplication } from "@/types/admission"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface ApplicationDocumentsDialogProps {
  application: AdmissionApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApplicationDocumentsDialog({ application, open, onOpenChange, onSuccess }: ApplicationDocumentsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: "", type: "ID Proof" })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docTypes, setDocTypes] = useState<string[]>(["ID Proof", "Birth Certificate", "Previous Report Card", "Transfer Certificate", "Others"])
  
  const [docs, setDocs] = useState<any[]>(application?.documents || [])

  const fetchDocumentTypes = async () => {
    try {
      const res = await apiClient("/admin/admissions/settings/document-types")
      if (!res.ok) return
      const payload = await res.json()
      const types = Array.isArray(payload?.document_types) ? payload.document_types : []
      if (types.length > 0) {
        setDocTypes(types)
        if (!types.includes(newDoc.type)) {
          setNewDoc((prev) => ({ ...prev, type: types[0] }))
        }
      }
    } catch {
      // keep fallback list
    }
  }

  useEffect(() => {
    if (!open) return
    setDocs(application?.documents || [])
    fetchDocumentTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application?.id])

  const handleUpload = async () => {
    if (!selectedFile || !newDoc.type) {
        toast.error("Please select a file and document type")
        return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)

    try {
        // 1. Upload file to storage
        const uploadRes = await apiClient("/files/upload", {
            method: "POST",
            body: formData,
            headers: {
                "X-Tenant-ID": application?.tenant_id || "",
            }
        })

        if (!uploadRes.ok) throw new Error("Upload failed")
        const uploadData = await uploadRes.json()

        // 2. Attach to application
        const attachRes = await apiClient(`/admin/admissions/applications/${application?.id}/documents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Tenant-ID": application?.tenant_id || "",
            },
            body: JSON.stringify({
                type: newDoc.type,
                url: uploadData.url
            })
        })

        if (!attachRes.ok) throw new Error("Failed to attach document")

        toast.success("Document uploaded successfully")
        setDocs([...docs, { 
            type: newDoc.type, 
            url: uploadData.url,
            attached_at: new Date().toISOString()
        }])
        setSelectedFile(null)
        setNewDoc({ ...newDoc, name: "" })
        onSuccess()
    } catch (error: any) {
        toast.error(error.message || "An error occurred during upload")
    } finally {
        setLoading(false)
    }
  }

  const removeDoc = async (index: number) => {
    if (!application?.id) return
    setLoading(true)
    try {
      const res = await apiClient(`/admin/admissions/applications/${application.id}/documents/${index}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to remove document")
      }
      setDocs(docs.filter((_, i) => i !== index))
      toast.success("Document removed")
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove document")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Documents - {application?.application_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-slate-50">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newDoc.type} onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {docTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input 
                type="file" 
                className="bg-white"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleUpload} disabled={loading || !selectedFile} className="w-full gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>View</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No documents uploaded yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    docs.map((doc, idx) => (
                        <TableRow key={idx}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" />
                                    {doc.type}
                                </div>
                            </TableCell>
                            <TableCell>
                                <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                    View File
                                </a>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {doc.attached_at ? new Date(doc.attached_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => removeDoc(idx)} disabled={loading}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
