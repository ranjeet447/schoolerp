"use client"

import { useEffect, useState } from "react"
import { ReceiptCard, Card, CardContent, CardHeader, CardTitle, Progress, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

const STORAGE_KEY = "parent.selectedChildId.fees"
const asArray = (payload: any) => (Array.isArray(payload) ? payload : payload?.data || [])
const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const s = (value as { String?: string }).String
    return typeof s === "string" ? s : ""
  }
  return ""
}
const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const b = (value as { Bytes?: unknown }).Bytes
    if (typeof b === "string") return b
  }
  return ""
}

export default function ParentFeesPage() {
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildID, setSelectedChildID] = useState("")
  const [summary, setSummary] = useState<any>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchChildren = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await apiClient("/parent/me/children")
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load children")
      }
      const payload = await res.json()
      const data = asArray(payload)
      const normalizedChildren = data.map((child: any) => ({
        id: uuidValue(child?.id),
        full_name: textValue(child?.full_name),
        class_name: textValue(child?.class_name),
        section_name: textValue(child?.section_name),
      }))
      setChildren(normalizedChildren)
      if (normalizedChildren.length > 0) {
        const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : ""
        const first = String(normalizedChildren[0].id)
        const selected = normalizedChildren.some((child: any) => String(child.id) === saved) ? String(saved) : first
        setSelectedChildID(selected)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load children")
      setChildren([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFees = async (childID: string) => {
    if (!childID) {
      setSummary(null)
      setReceipts([])
      return
    }

    setLoading(true)
    setError("")
    try {
      const [summaryRes, receiptsRes] = await Promise.all([
        apiClient(`/parent/children/${childID}/fees/summary`),
        apiClient(`/parent/children/${childID}/fees/receipts`),
      ])

      if (!summaryRes.ok) {
        const msg = await summaryRes.text()
        throw new Error(msg || "Failed to load fee summary")
      }

      const summaryPayload = await summaryRes.json()
      setSummary(summaryPayload || null)

      if (receiptsRes.ok) {
        const receiptsPayload = await receiptsRes.json()
        const receiptsData = asArray(receiptsPayload)
        setReceipts(receiptsData)
      } else {
        setReceipts([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fees")
      setSummary(null)
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChildren()
  }, [])

  useEffect(() => {
    if (selectedChildID) fetchFees(selectedChildID)
  }, [selectedChildID])

  useEffect(() => {
    if (!selectedChildID) return
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, selectedChildID)
  }, [selectedChildID])

  const totalFees = Number(summary?.total_amount ?? summary?.total ?? 0)
  const paidFees = Number(summary?.paid_amount ?? summary?.paid ?? 0)
  const percentage = totalFees > 0 ? (paidFees / totalFees) * 100 : 0

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fees & Payments</h1>
      </div>

      <div className="max-w-sm">
        <Select value={selectedChildID} onValueChange={setSelectedChildID}>
          <SelectTrigger>
            <SelectValue placeholder="Select child" />
          </SelectTrigger>
          <SelectContent>
            {children.map((child) => (
              <SelectItem key={String(child.id)} value={String(child.id)}>
                {child.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      {loading && <div className="text-sm text-muted-foreground">Loading fees...</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 shadow-md border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-black">₹{paidFees.toLocaleString()}</span>
              <span className="text-sm font-medium text-gray-400">of ₹{totalFees.toLocaleString()}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-gray-500 font-medium">You have paid {Math.round(percentage)}% of the total annual fees.</p>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Payment History</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {receipts.map((r) => {
              const status = String(r.status || "issued").toLowerCase() === "cancelled" ? "cancelled" : "issued"
              return (
              <ReceiptCard
                key={String(r.id)}
                receiptNumber={String(r.receipt_number || r.receiptNumber || "-")}
                studentName={String(r.student_name || r.studentName || "Student")}
                amount={Number(r.amount || 0)}
                date={String(r.date || r.issued_at || "")}
                mode={String(r.mode || "offline")}
                status={status}
                onDownload={() => {
                  const url = String(r.url || r.receipt_url || "")
                  if (url) {
                    window.open(url, "_blank", "noopener,noreferrer")
                    return
                  }
                  toast.info("Receipt download URL not available")
                }}
              />
              )
            })}
          </div>
        </div>
      </div>

      {!loading && receipts.length === 0 && (
        <div className="text-sm text-muted-foreground">No receipts found for this student.</div>
      )}
    </div>
  )
}
