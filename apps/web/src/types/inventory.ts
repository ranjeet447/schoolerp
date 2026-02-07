export interface InventoryCategory {
  id: string
  tenant_id: string
  name: string
  type: 'asset' | 'consumable'
  description?: string
  created_at: string
  updated_at: string
}

export interface InventorySupplier {
  id: string
  tenant_id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  tenant_id: string
  category_id?: string
  name: string
  sku?: string
  description?: string
  unit?: string
  reorder_level?: number
  current_stock: number
  category_name?: string
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  tenant_id: string
  item_id: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  unit_price?: number
  supplier_id?: string
  reference_id?: string
  reference_type?: string
  remarks?: string
  created_by: string
  created_at: string
  item_name: string
  created_by_name?: string
}
