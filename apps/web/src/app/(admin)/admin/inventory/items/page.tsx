"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Input
} from "@schoolerp/ui"
import { AlertTriangle, Plus, Search, Package, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { InventoryItem } from "@/types/inventory"
import { ItemDialog } from "@/components/inventory/item-dialog"
import { cn } from "@/lib/utils"

export default function ItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")
    try {
      const res = await apiClient("/admin/inventory/items")
      if (!res.ok) {
        throw new Error(await res.text() || "Failed to fetch inventory items")
      }
      setItems(await res.json() || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inventory items")
    } finally {
      setLoading(false)
      setRefreshing(false)
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchItems(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-none shadow-sm bg-destructive/10">
          <CardContent className="pt-6 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Items</CardTitle>
                  <div className="p-2 rounded-full bg-primary/10">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="text-3xl font-black text-foreground">{items.length}</div>
              </CardContent>
          </Card>
          
          <Card className={cn("border-none shadow-sm", lowStockItems.length > 0 ? "bg-amber-100 dark:bg-amber-400/10" : "")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reorder Alerts</CardTitle>
                  <div className={cn("p-2 rounded-full", lowStockItems.length > 0 ? "bg-amber-200 dark:bg-amber-400/20" : "bg-muted")}>
                    <AlertTriangle className={cn("h-4 w-4", lowStockItems.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
                  </div>
              </CardHeader>
              <CardContent>
                  <div className={cn("text-3xl font-black", lowStockItems.length > 0 ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>{lowStockItems.length}</div>
                  {lowStockItems.length > 0 && (
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400/80 mt-1">Items require replenishment</p>
                  )}
              </CardContent>
          </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-lg">Catalog Items ({filteredItems.length})</CardTitle>
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
          <CardContent className="p-0">
            <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                    <TableHead className="text-muted-foreground font-bold">Item Name</TableHead>
                    <TableHead className="text-muted-foreground font-bold">SKU</TableHead>
                    <TableHead className="text-muted-foreground font-bold">Category</TableHead>
                    <TableHead className="text-muted-foreground font-bold">Stock</TableHead>
                    <TableHead className="text-right text-muted-foreground font-bold">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                {loading ? (
                    <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
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
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            {item.name}
                        </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium text-muted-foreground">{item.sku || "-"}</TableCell>
                        <TableCell className="text-muted-foreground font-medium">{item.category_name || "-"}</TableCell>
                        <TableCell>
                            <Badge variant={item.current_stock > (item.reorder_level || 0) ? "outline" : "destructive"} className={item.current_stock > (item.reorder_level || 0) ? "text-emerald-600 dark:text-emerald-400 border-emerald-600/20 bg-emerald-600/10" : "gap-1"}>
                                {item.current_stock <= (item.reorder_level || 0) && <AlertTriangle className="h-3 w-3" />}
                                {item.current_stock}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="text-primary hover:text-primary hover:bg-primary/10">
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
