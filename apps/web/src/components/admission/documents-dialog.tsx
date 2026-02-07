"use client"

import { useState } from "react"
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@schoolerp/ui"
import { FileText, Upload, Trash2 } from "lucide-react"
import { AdmissionApplication } from "@/types/admission"

interface ApplicationDocumentsDialogProps {
  application: AdmissionApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ApplicationDocumentsDialog({ application, open, onOpenChange, onSuccess }: ApplicationDocumentsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: "", type: "ID Proof" })
  
  // Mocking the documents from application.documents or local state for now
  const [docs, setDocs] = useState<any[]>(application?.documents || [
    { name: "Birth Certificate.pdf", type: "Certificate", date: "2024-02-07" }
  ])

  const handleUpload = () => {
    if (!newDoc.name) return
    setLoading(true)
    // Simulate API call to store mock document in JSONB
    setTimeout(() => {
        setDocs([...docs, { ...newDoc, date: new Date().toISOString().split('T')[0] }])
        setNewDoc({ name: "", type: "ID Proof" })
        setLoading(false)
    }, 500)
  }

  const removeDoc = (index: number) => {
    setDocs(docs.filter((_, i) => i !== index))
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
              <Label>Document Name</Label>
              <Input 
                placeholder="e.g. Passport Copy" 
                value={newDoc.name}
                onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input 
                value={newDoc.type}
                onChange={(e) => setNewDoc({...newDoc, type: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleUpload} disabled={loading} className="w-full gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
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
                                    {doc.name}
                                </div>
                            </TableCell>
                            <TableCell>{doc.type}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{doc.date}</TableCell>
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
          <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
