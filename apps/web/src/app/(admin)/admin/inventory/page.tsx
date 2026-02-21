"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Avatar,
  AvatarFallback
} from "@schoolerp/ui"
import { Plus, Package, Truck, ShoppingCart, ListChecks, History, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("items")
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [pos, setPos] = useState([])
  const [transactions, setTransactions] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    const res = await Promise.all([
      apiClient("/inventory/items"),
      apiClient("/inventory/categories"),
      apiClient("/inventory/suppliers"),
      apiClient("/inventory/purchase-orders"),
      apiClient("/inventory/transactions?limit=10"),
      apiClient("/inventory/requisitions")
    ])

    if (res[0].ok) setItems(await res[0].json())
    if (res[1].ok) setCategories(await res[1].json())
    if (res[2].ok) setSuppliers(await res[2].json())
    if (res[3].ok) setPos(await res[3].json())
    if (res[4].ok) setTransactions(await res[4].json())
    if (res[5].ok) setRequisitions(await res[5].json())
    
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage school assets, consumables, and procurement.</p>
        </div>
        <div className="flex gap-2">
            <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
            <Button variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" /> New PO
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="p-1 rounded-xl">
          <TabsTrigger value="items" className="rounded-lg gap-2"><Package className="h-4 w-4" /> Stock Items</TabsTrigger>
          <TabsTrigger value="requisitions" className="rounded-lg gap-2"><ListChecks className="h-4 w-4" /> Requisitions</TabsTrigger>
          <TabsTrigger value="procurement" className="rounded-lg gap-2"><ShoppingCart className="h-4 w-4" /> Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" className="rounded-lg gap-2"><Truck className="h-4 w-4" /> Suppliers</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2"><History className="h-4 w-4" /> Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions">
          <Card className="border-none shadow-sm overflow-hidden">
             <Table>
                <TableHeader className="bg-muted/50">
                   <TableRow>
                     <TableHead className="text-muted-foreground font-bold">Requester</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Dept / Purpose</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Status</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Requested At</TableHead>
                     <TableHead className="text-right text-muted-foreground font-bold">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                   {requisitions.map((req: any) => (
                     <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                       <TableCell className="font-semibold text-foreground">{req.requester_name || 'N/A'}</TableCell>
                       <TableCell className="text-muted-foreground">
                          <p className="font-medium text-foreground">{req.department}</p>
                          <p className="text-xs text-muted-foreground">{req.purpose}</p>
                       </TableCell>
                       <TableCell>
                          <Badge variant="secondary" className={
                            req.status === 'issued' ? 'bg-emerald-500 text-white' : 
                            req.status === 'approved' ? 'bg-primary text-primary-foreground' : 
                            req.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-destructive text-white'
                          }>
                            {req.status.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-muted-foreground text-sm font-medium">
                          {new Date(req.created_at).toLocaleDateString()}
                       </TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                            View Details
                          </Button>
                       </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
             </Table>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Catalog & Stock Levels</CardTitle>
                <div className="flex gap-2 w-72">
                    <Input placeholder="Search items..." />
                </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-muted/50">
                   <TableRow>
                     <TableHead className="text-muted-foreground font-bold">Item Name</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Category</TableHead>
                     <TableHead className="text-muted-foreground font-bold">SKU</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Stock Level</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Unit</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody className="divide-y">
                   {items.map((item: any) => (
                     <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                       <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                       <TableCell className="text-muted-foreground font-medium">{item.category_name || 'N/A'}</TableCell>
                       <TableCell className="text-muted-foreground font-mono text-xs font-semibold">{item.sku}</TableCell>
                       <TableCell>
                          <span className={`font-black ${item.quantity <= item.reorder_level ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {item.quantity}
                          </span>
                       </TableCell>
                       <TableCell className="text-muted-foreground font-medium">{item.unit}</TableCell>
                       <TableCell>
                         {item.quantity <= item.reorder_level ? (
                           <Badge variant="outline" className="text-rose-600 border-rose-600/20 bg-rose-600/10 dark:text-rose-400 gap-1">
                             <AlertTriangle className="h-3 w-3" /> Reorder
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="text-emerald-600 border-emerald-600/20 bg-emerald-600/10 dark:text-emerald-400">In Stock</Badge>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procurement">
          <Card className="border-none shadow-sm overflow-hidden">
             <Table>
                <TableHeader className="bg-muted/50">
                   <TableRow>
                     <TableHead className="text-muted-foreground font-bold">PO Number</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Supplier</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Status</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Created At</TableHead>
                     <TableHead className="text-right text-muted-foreground font-bold">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                   {pos.map((po: any) => (
                     <TableRow key={po.id} className="hover:bg-muted/30 transition-colors">
                       <TableCell className="font-semibold text-foreground">{po.po_number}</TableCell>
                       <TableCell className="text-muted-foreground font-medium">{po.supplier_name}</TableCell>
                       <TableCell>
                          <Badge variant="secondary" className={
                            po.status === 'received' ? 'bg-emerald-500 text-white' : 
                            po.status === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }>
                            {po.status.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-muted-foreground text-sm font-medium">
                          {new Date(po.created_at).toLocaleDateString()}
                       </TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">Details</Button>
                       </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
             </Table>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suppliers.map((s: any) => (
                <Card key={s.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                       <AvatarFallback className="bg-primary/10 text-primary font-bold">{s.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{s.name}</CardTitle>
                        <p className="text-sm text-muted-foreground font-medium">{s.contact_person}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                     <p className="text-muted-foreground font-medium"><span className="text-foreground font-semibold">Tel:</span> {s.phone}</p>
                     <p className="text-muted-foreground font-medium"><span className="text-foreground font-semibold">Email:</span> {s.email}</p>
                     <div className="pt-4">
                        <Button variant="secondary" className="w-full">View History</Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="history">
           <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                 <TableHeader className="bg-muted/50">
                   <TableRow>
                     <TableHead className="text-muted-foreground font-bold">Date</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Item</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Type</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Qty</TableHead>
                     <TableHead className="text-muted-foreground font-bold">Reference</TableHead>
                     <TableHead className="text-muted-foreground font-bold">By</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody className="divide-y">
                   {transactions.map((tx: any) => (
                     <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                       <TableCell className="text-muted-foreground font-medium text-sm">{new Date(tx.created_at).toLocaleString()}</TableCell>
                       <TableCell className="font-semibold text-foreground">{tx.item_name}</TableCell>
                       <TableCell>
                          <Badge variant="outline" className={
                             tx.type === 'in' ? 'text-emerald-600 border-emerald-600/20 bg-emerald-600/10 dark:text-emerald-400' :
                             tx.type === 'out' ? 'text-rose-600 border-rose-600/20 bg-rose-600/10 dark:text-rose-400' :
                             'text-amber-600 border-amber-600/20 bg-amber-600/10 dark:text-amber-400'
                          }>
                            {tx.type.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="font-black">{tx.type === 'out' ? '-' : '+'}{tx.quantity}</TableCell>
                       <TableCell className="text-muted-foreground font-medium">{tx.reference_type || 'Manual'}</TableCell>
                       <TableCell className="text-muted-foreground text-sm font-medium">{tx.user_name}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
              </Table>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
