"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@schoolerp/ui"
import { Plus, User, Phone, Mail } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { InventorySupplier } from "@/types/inventory"
import { SupplierDialog } from "@/components/inventory/supplier-dialog"

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<InventorySupplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<InventorySupplier | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/inventory/suppliers")
      if (res.ok) {
        setSuppliers(await res.json() || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedSupplier(null)
    setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage vendors and supply partners.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">All Suppliers ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-muted-foreground font-bold">Supplier Name</TableHead>
                <TableHead className="text-muted-foreground font-bold">Contact Person</TableHead>
                <TableHead className="text-muted-foreground font-bold">Phone</TableHead>
                <TableHead className="text-muted-foreground font-bold">Email</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
                    Loading suppliers...
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {supplier.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{supplier.contact_person || "-"}</TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {supplier.phone || "-"}
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                        <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {supplier.email || "-"}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => {
                          setSelectedSupplier(supplier)
                          setDialogOpen(true)
                      }} className="text-primary hover:text-primary hover:bg-primary/10">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SupplierDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchSuppliers}
        supplier={selectedSupplier}
      />
    </div>
  )
}
