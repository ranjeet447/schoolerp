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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Inventory Management</h1>
          <p className="text-slate-400 font-medium">Manage school assets, consumables, and procurement.</p>
        </div>
        <div className="flex gap-2">
            <Button className="bg-indigo-600">
                <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
            <Button variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" /> New PO
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-900 border-white/5 p-1 rounded-xl">
          <TabsTrigger value="items" className="rounded-lg gap-2"><Package className="h-4 w-4" /> Stock Items</TabsTrigger>
          <TabsTrigger value="requisitions" className="rounded-lg gap-2"><ListChecks className="h-4 w-4" /> Requisitions</TabsTrigger>
          <TabsTrigger value="procurement" className="rounded-lg gap-2"><ShoppingCart className="h-4 w-4" /> Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" className="rounded-lg gap-2"><Truck className="h-4 w-4" /> Suppliers</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2"><History className="h-4 w-4" /> Stock History</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions">
          <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
             <Table>
                <TableHeader className="bg-white/5">
                   <TableRow>
                     <TableHead>Requester</TableHead>
                     <TableHead>Dept / Purpose</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Requested At</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {requisitions.map((req: any) => (
                     <TableRow key={req.id} className="hover:bg-white/5 border-white/5">
                       <TableCell className="font-bold text-white">{req.requester_name || 'N/A'}</TableCell>
                       <TableCell className="text-slate-400">
                          <p className="font-medium text-slate-300">{req.department}</p>
                          <p className="text-xs text-slate-500">{req.purpose}</p>
                       </TableCell>
                       <TableCell>
                          <Badge className={
                            req.status === 'issued' ? 'bg-emerald-500' : 
                            req.status === 'approved' ? 'bg-indigo-500' : 
                            req.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
                          }>
                            {req.status.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-slate-500 text-sm">
                          {new Date(req.created_at).toLocaleDateString()}
                       </TableCell>
                       <TableCell className="text-right text-indigo-400 font-bold cursor-pointer">
                          View Details
                       </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
             </Table>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle>Catalog & Stock Levels</CardTitle>
                <div className="flex gap-2 w-72">
                    <Input placeholder="Search items..." className="bg-slate-900 border-white/10" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader className="bg-white/5">
                   <TableRow>
                     <TableHead>Item Name</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>SKU</TableHead>
                     <TableHead>Stock Level</TableHead>
                     <TableHead>Unit</TableHead>
                     <TableHead>Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {items.map((item: any) => (
                     <TableRow key={item.id} className="hover:bg-white/5 border-white/5">
                       <TableCell className="font-bold text-white">{item.name}</TableCell>
                       <TableCell className="text-slate-400">{item.category_name || 'N/A'}</TableCell>
                       <TableCell className="text-slate-500 font-mono text-xs">{item.sku}</TableCell>
                       <TableCell>
                          <span className={`font-bold ${item.quantity <= item.reorder_level ? 'text-red-400' : 'text-emerald-400'}`}>
                            {item.quantity}
                          </span>
                       </TableCell>
                       <TableCell className="text-slate-400">{item.unit}</TableCell>
                       <TableCell>
                         {item.quantity <= item.reorder_level ? (
                           <Badge variant="outline" className="text-red-400 border-red-400/20 bg-red-400/10 gap-1">
                             <AlertTriangle className="h-3 w-3" /> Reorder
                           </Badge>
                         ) : (
                           <Badge variant="outline" className="text-emerald-400 border-emerald-400/20 bg-emerald-400/10">In Stock</Badge>
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
          <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
             <Table>
                <TableHeader className="bg-white/5">
                   <TableRow>
                     <TableHead>PO Number</TableHead>
                     <TableHead>Supplier</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Created At</TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {pos.map((po: any) => (
                     <TableRow key={po.id} className="hover:bg-white/5 border-white/5">
                       <TableCell className="font-bold text-white">{po.po_number}</TableCell>
                       <TableCell className="text-slate-400">{po.supplier_name}</TableCell>
                       <TableCell>
                          <Badge className={
                            po.status === 'received' ? 'bg-emerald-500' : 
                            po.status === 'approved' ? 'bg-indigo-500' : 'bg-slate-500'
                          }>
                            {po.status.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-slate-500 text-sm">
                          {new Date(po.created_at).toLocaleDateString()}
                       </TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
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
                <Card key={s.id} className="bg-slate-900/50 border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12 border border-white/10">
                       <AvatarFallback className="bg-indigo-500/20 text-indigo-300 font-bold">{s.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-lg">{s.name}</CardTitle>
                        <p className="text-sm text-slate-500">{s.contact_person}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                     <p className="text-slate-400"><span className="text-slate-600">Tel:</span> {s.phone}</p>
                     <p className="text-slate-400"><span className="text-slate-600">Email:</span> {s.email}</p>
                     <div className="pt-2">
                        <Button variant="secondary" size="sm" className="w-full">View History</Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>

        <TabsContent value="history">
           <Card className="bg-slate-900/50 border-white/5 rounded-3xl overflow-hidden">
              <Table>
                 <TableHeader className="bg-white/5">
                   <TableRow>
                     <TableHead>Date</TableHead>
                     <TableHead>Item</TableHead>
                     <TableHead>Type</TableHead>
                     <TableHead>Qty</TableHead>
                     <TableHead>Reference</TableHead>
                     <TableHead>By</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {transactions.map((tx: any) => (
                     <TableRow key={tx.id} className="hover:bg-white/5 border-white/5">
                       <TableCell className="text-slate-500 text-sm">{new Date(tx.created_at).toLocaleString()}</TableCell>
                       <TableCell className="font-bold text-white">{tx.item_name}</TableCell>
                       <TableCell>
                          <Badge variant="outline" className={
                             tx.type === 'in' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                             tx.type === 'out' ? 'text-rose-400 border-rose-400/20 bg-rose-400/5' :
                             'text-amber-400 border-amber-400/20 bg-amber-400/5'
                          }>
                            {tx.type.toUpperCase()}
                          </Badge>
                       </TableCell>
                       <TableCell className="font-bold">{tx.type === 'out' ? '-' : '+'}{tx.quantity}</TableCell>
                       <TableCell className="text-slate-500">{tx.reference_type || 'Manual'}</TableCell>
                       <TableCell className="text-slate-400 text-sm">{tx.user_name}</TableCell>
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
