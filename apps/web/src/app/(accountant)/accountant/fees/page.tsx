"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  FeePlanBuilder, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge
} from "@schoolerp/ui"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@schoolerp/ui"
import { toast } from "sonner"

export default function AccountantFeesPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await apiClient("/admin/fees/plans")
      if (res.ok) {
        const data = await res.json()
        setPlans(data || [])
      }
    } catch (err) {
      console.error("Failed to fetch plans", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async (plan: any) => {
    try {
      const res = await apiClient("/admin/fees/plans", {
        method: "POST",
        body: JSON.stringify(plan)
      })
      if (res.ok) {
        toast.success("Fee plan created successfully")
        fetchPlans()
      }
    } catch (err) {
      toast.error("Failed to save plan")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Finance Management</h1>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Fee Plans</TabsTrigger>
          <TabsTrigger value="heads">Fee Heads</TabsTrigger>
          <TabsTrigger value="series">Receipt Series</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <FeePlanBuilder onSave={handleSavePlan} />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold">Existing Plans</h2>
              {plans.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed rounded-xl text-gray-400">
                  No plans defined yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map(p => (
                    <Card key={p.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{p.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">{p.items.length} items</span>
                          <span className="text-lg font-bold">₹{p.items.reduce((a, i) => a + i.amount, 0)}</span>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4">Assign Students</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heads" className="pt-4">
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Fee head management table coming soon...
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="series" className="pt-4">
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              Receipt series configuration coming soon...
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
