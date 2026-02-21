"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, ArrowDown, ArrowUp } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { InventoryTransaction } from "@/types/inventory"
import { TransactionDialog } from "@/components/inventory/transaction-dialog"
import { cn } from "@/lib/utils"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/inventory/transactions?limit=50")
      if (res.ok) {
        const data = await res.json()
        setTransactions(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Transactions</h1>
          <p className="text-muted-foreground">History of all stock movements (In/Out).</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          New Transaction
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Recent Transactions ({transactions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-muted-foreground font-bold">Type</TableHead>
                <TableHead className="text-muted-foreground font-bold">Item</TableHead>
                <TableHead className="text-muted-foreground font-bold">Qty</TableHead>
                <TableHead className="text-muted-foreground font-bold">Date</TableHead>
                <TableHead className="text-muted-foreground font-bold">Performed By</TableHead>
                <TableHead className="text-muted-foreground font-bold">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                    Loading history...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                    No transactions recorded.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant={txn.type === 'in' ? 'outline' : 'outline'} className={cn(
                        txn.type === 'in' ? "text-emerald-600 dark:text-emerald-400 border-emerald-600/20 bg-emerald-600/10" : "text-rose-600 dark:text-rose-400 border-rose-600/20 bg-rose-600/10",
                        "gap-1"
                      )}>
                        {txn.type === 'in' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                        {txn.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">{txn.item_name}</TableCell>
                    <TableCell className="font-mono font-black">{txn.type === 'out' ? '-' : '+'}{txn.quantity}</TableCell>
                    <TableCell className="text-muted-foreground font-medium text-sm">{new Date(txn.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground font-medium text-sm">{txn.created_by_name || "System"}</TableCell>
                    <TableCell className="text-muted-foreground font-medium text-sm max-w-xs truncate">
                        {txn.remarks}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchTransactions}
      />
    </div>
  )
}
