import * as React from "react"
import { cn } from "../lib/utils"
import { Badge } from "./badge"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"

interface FeeHead {
  id: string
  name: string
  amount: number
}

interface FeePlanBuilderProps {
  onSave: (plan: { name: string; items: FeeHead[] }) => void
}

export function FeePlanBuilder({ onSave }: FeePlanBuilderProps) {
  const [name, setName] = React.useState("")
  const [items, setItems] = React.useState<FeeHead[]>([])
  const [newHeadName, setNewHeadName] = React.useState("")
  const [newAmount, setNewAmount] = React.useState("")

  const addItem = () => {
    if (newHeadName && newAmount) {
      setItems([...items, { id: Math.random().toString(), name: newHeadName, amount: Number(newAmount) }])
      setNewHeadName("")
      setNewAmount("")
    }
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const total = items.reduce((acc, item) => acc + item.amount, 0)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Plan Name</Label>
        <Input 
          placeholder="e.g. Grade 10 - Annual Plan" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
      </div>

      <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium">Fee Heads</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Head Name</Label>
            <Input 
              placeholder="e.g. Tuition Fee" 
              value={newHeadName} 
              onChange={(e) => setNewHeadName(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="0" 
                value={newAmount} 
                onChange={(e) => setNewAmount(e.target.value)} 
              />
              <Button type="button" onClick={addItem}>Add</Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm">
              <span className="text-sm">{item.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">₹{item.amount}</span>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="flex justify-between pt-2 border-t font-bold">
            <span>Total Plan Amount</span>
            <span>₹{total}</span>
          </div>
        )}
      </div>

      <Button 
        className="w-full" 
        disabled={!name || items.length === 0}
        onClick={() => onSave({ name, items })}
      >
        Save Fee Plan
      </Button>
    </div>
  )
}
