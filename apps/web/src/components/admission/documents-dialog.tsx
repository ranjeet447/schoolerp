"use client"

import { useState } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@schoolerp/ui"
import { FileText, Upload, Trash2, Loader2 } from "lucide-react"
import { AdmissionApplication } from "@/types/admission"
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
  
  const [docs, setDocs] = useState<any[]>(application?.documents || [])

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
        const uploadRes = await fetch("/api/v1/files/upload", {
            method: "POST",
            body: formData,
            headers: {
                "X-Tenant-ID": application?.tenant_id || "",
            }
        })

        if (!uploadRes.ok) throw new Error("Upload failed")
        const uploadData = await uploadRes.json()

        // 2. Attach to application
        const attachRes = await fetch(`/api/v1/admin/admissions/applications/${application?.id}/documents`, {
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

  const removeDoc = (index: number) => {
    // In a real app, call a DELETE endpoint
    setDocs(docs.filter((_, i) => i !== index))
    toast.info("Document removed from view (not deleted from server)")
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
              <select 
                className="w-full p-2 border rounded-md bg-white text-sm"
                value={newDoc.type}
                onChange={(e) => setNewDoc({...newDoc, type: e.target.value})}
              >
                <option>ID Proof</option>
                <option>Birth Certificate</option>
                <option>Previous Report Card</option>
                <option>Transfer Certificate</option>
                <option>Others</option>
              </select>
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
                                <Button variant="ghost" size="sm" onClick={() => removeDoc(idx)}>
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
