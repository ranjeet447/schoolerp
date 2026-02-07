"use client"

import { useState } from "react"
import { Button } from "@schoolerp/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@schoolerp/ui"
import { Input } from "@schoolerp/ui"
import { Label } from "@schoolerp/ui"
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"

export function ImportStudentWizard() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    total_rows: number
    success_count: number
    errors: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const onImport = async () => {
    if (!file) return
    setLoading(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await apiClient("/admin/students/import", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Import failed")
      
      const data = await res.json()
      setResult(data)
      setStep(3)
    } catch (error) {
      console.error(error)
      alert("Failed to import students")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setFile(null)
    setResult(null)
    setOpen(false)
    if (result?.success_count && result.success_count > 0) {
        window.location.reload()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Bulk upload student records using a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && (
            <div className="grid gap-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-slate-50">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Upload your student list CSV file.<br/>
                  Expected columns: admission_no, full_name, gender, dob
                </p>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="secondary" onClick={() => document.getElementById('csv-upload')?.click()}>
                  {file ? file.name : "Choose File"}
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <div className="flex items-center p-4 border rounded-lg">
                <FileText className="h-8 w-8 mr-4 text-primary" />
                <div>
                  <p className="font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file?.size || 0) / 1024 > 1024 
                      ? `${((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB` 
                      : `${((file?.size || 0) / 1024).toFixed(2)} KB`}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Ready to import. This will create new student records.
              </p>
            </div>
          )}

          {step === 3 && result && (
            <div className="grid gap-4">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <h3 className="text-lg font-semibold">Import Complete</h3>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {result.success_count} out of {result.total_rows} students.
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4 border rounded-lg bg-red-50 p-4 max-h-[200px] overflow-y-auto">
                    <div className="flex items-center text-red-800 mb-2">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Errors found:</span>
                    </div>
                    <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                        {result.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!file}>
              Next
            </Button>
          )}
          {step === 2 && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button onClick={onImport} disabled={loading}>
                {loading ? "Importing..." : "Start Import"}
              </Button>
            </div>
          )}
          {step === 3 && (
            <Button onClick={reset}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
