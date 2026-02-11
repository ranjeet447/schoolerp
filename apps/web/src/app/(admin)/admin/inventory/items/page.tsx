"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Input
} from "@schoolerp/ui"
import { AlertTriangle, Plus, Search, Package } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { InventoryItem } from "@/types/inventory"
import { ItemDialog } from "@/components/inventory/item-dialog"
import { cn } from "@/lib/utils"

export default function ItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/inventory/items")
      if (res.ok) {
        setItems(await res.json() || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedItem(null)
    setDialogOpen(true)
  }

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const lowStockItems = items.filter(item => item.current_stock <= (item.reorder_level || 0))

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Master</h1>
          <p className="text-muted-foreground">Manage your school's inventory catalog.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{items.length}</div>
              </CardContent>
          </Card>
          
          <Card className={cn(lowStockItems.length > 0 ? "border-amber-200 bg-amber-50" : "")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reorder Alerts</CardTitle>
                  <AlertTriangle className={cn("h-4 w-4", lowStockItems.length > 0 ? "text-amber-500" : "text-muted-foreground")} />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{lowStockItems.length}</div>
                  {lowStockItems.length > 0 && (
                      <p className="text-xs text-amber-600 font-medium">Items require replenishment</p>
                  )}
              </CardContent>
          </Card>
      </div>

      <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Catalog Items ({filteredItems.length})</CardTitle>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search items..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading items...
                    </TableCell>
                    </TableRow>
                ) : filteredItems.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No items found.
                    </TableCell>
                    </TableRow>
                ) : (
                    filteredItems.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            {item.name}
                        </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{item.sku || "-"}</TableCell>
                        <TableCell>{item.category_name || "-"}</TableCell>
                        <TableCell>
                            <Badge variant={item.current_stock > (item.reorder_level || 0) ? "outline" : "secondary"}>
                                {item.current_stock}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
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

      <ItemDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchItems}
        item={selectedItem}
      />
    </div>
  )
}
